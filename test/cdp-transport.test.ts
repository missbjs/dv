import { afterEach, describe, expect, it } from 'vitest';
import { WebSocketServer } from 'ws';
import { CDPTransport } from '../src/cdp-transport.js';

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const fn of cleanup.splice(0).reverse()) await fn(); });
async function fixture() {
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  await new Promise<void>(r => server.once('listening', r));
  cleanup.push(async () => { server.clients.forEach(ws => ws.terminate()); await new Promise<void>(r => server.close(() => r())); });
  const transport = new CDPTransport({ timeout: 100 });
  cleanup.push(() => transport.close());
  const received: any[] = [];
  server.on('connection', ws => ws.on('message', data => {
    const message = JSON.parse(String(data)); received.push(message);
    if (message.method === 'Slow') return;
    if (message.method === 'Close') { ws.close(); return; }
    if (message.method === 'Fail') { ws.send(JSON.stringify({ id: message.id, sessionId: message.sessionId, error: { message: 'Protocol failure' } })); return; }
    ws.send(JSON.stringify({ id: message.id, sessionId: message.sessionId, result: { session: message.sessionId ?? 'page' } }));
    ws.send(JSON.stringify({ method: 'Network.loadingFinished', sessionId: message.sessionId, params: { requestId: 'r' } }));
  }));
  await transport.open(`ws://127.0.0.1:${(server.address() as any).port}`);
  return { transport, received };
}
describe('shared CDP wire transport', () => {
  it('routes flattened session commands and preserves session identity on events', async () => {
    const f = await fixture();
    const events: any[] = [];
    f.transport.on('event', message => events.push(message));
    const replies = await Promise.all([f.transport.send('Network.enable', {}, 'session-a'), f.transport.send('Network.enable', {}, 'session-b')]);
    expect(replies.map(r => r.session)).toEqual(['session-a', 'session-b']);
    expect(events.map(e => e.sessionId)).toEqual(['session-a', 'session-b']);
    expect(f.received.map(r => r.sessionId)).toEqual(['session-a', 'session-b']);
  });
  it('rejects pending commands immediately on peer close and rejects sends after close', async () => {
    const f = await fixture();
    await expect(f.transport.send('Close')).rejects.toThrow('closed');
    await expect(f.transport.send('Network.enable')).rejects.toThrow('Not connected');
  });
  it('rejects protocol errors and removes timed-out pending commands', async () => {
    const f = await fixture();
    await expect(f.transport.send('Fail')).rejects.toThrow('Protocol failure');
    await expect(f.transport.send('Slow')).rejects.toThrow('Timeout');
    expect(await f.transport.send('Network.enable')).toEqual({ session: 'page' });
  });
});
