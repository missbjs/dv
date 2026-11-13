import { describe, it, expect, afterEach } from 'vitest';
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { TabNetworkRecorder } from '../src/network-capture.js';
import { NetworkStore } from '../src/network-store.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
async function fixture() {
  const sockets = new Map<string, WebSocket>();
  let port = 0;
  const server = http.createServer((_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(['tab-a', 'tab-b'].map(id => ({ id, type: 'page', url: 'https://test', webSocketDebuggerUrl: `ws://127.0.0.1:${port}/${id}` }))));
  });
  const wsServer = new WebSocketServer({ server });
  const calls: any[] = [];
  wsServer.on('connection', (ws, req) => {
    sockets.set(req.url!.slice(1), ws);
    ws.on('message', data => {
      const m = JSON.parse(String(data)); calls.push(m);
      const result = m.method === 'Network.getResponseBody' ? { body: 'saved body', base64Encoded: false } : {};
      ws.send(JSON.stringify({ id: m.id, result }));
    });
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  port = (server.address() as any).port;
  cleanups.push(async () => { wsServer.clients.forEach(ws => ws.terminate()); await new Promise<void>(r => wsServer.close(() => server.close(() => r()))); });
  const store = new NetworkStore();
  const recorder = new TabNetworkRecorder(port, store);
  await recorder.select('tab-a');
  cleanups.push(() => recorder.close());
  return { recorder, store, calls, sockets, emit: (method: string, params: any, tab = 'tab-a') => sockets.get(tab)!.send(JSON.stringify({ method, params })) };
}

describe('selected-tab persistent recorder', () => {
  it('reuses CDPClient and saves completed response bodies without browser-session commands', async () => {
    const f = await fixture();
    expect(f.calls.some(m => m.method === 'Network.enable')).toBe(true);
    expect(f.calls.some(m => m.method.startsWith('Target.'))).toBe(false);
    expect(f.sockets.size).toBe(1);
    f.emit('Network.requestWillBeSent', { requestId: 'r', timestamp: 1, wallTime: 1700000000, request: { url: 'https://example.test', method: 'GET' } });
    f.emit('Network.responseReceived', { requestId: 'r', response: { status: 200 } });
    f.emit('Network.loadingFinished', { requestId: 'r', timestamp: 2 });
    await expect.poll(() => f.store.list()[0]?.body?.body).toBe('saved body');
  });
  it('hands off to exactly one selected tab and retains old history separately', async () => {
    const f = await fixture();
    f.emit('Network.requestWillBeSent', { requestId: 'r', timestamp: 1, request: { url: 'https://example.test', method: 'GET' } });
    await expect.poll(() => f.store.list('tab-a').length).toBe(1);
    await f.recorder.select('tab-b');
    expect(f.recorder.tabId).toBe('tab-b');
    expect(f.store.list('tab-a')[0].state).toBe('detached');
    f.emit('Network.requestWillBeSent', { requestId: 'r', timestamp: 2, request: { url: 'https://other.test', method: 'GET' } }, 'tab-b');
    await expect.poll(() => f.store.list('tab-b').length).toBe(1);
    expect(f.store.list('tab-a')).toHaveLength(1);
    const callsBefore = f.calls.length;
    await f.recorder.select('tab-b');
    expect(f.calls).toHaveLength(callsBefore);
  });
  it('does not abandon the active tab when a requested tab does not exist', async () => {
    const f = await fixture();
    await expect(f.recorder.select('missing')).rejects.toThrow('No tab');
    expect(f.recorder.tabId).toBe('tab-a');
  });
});
