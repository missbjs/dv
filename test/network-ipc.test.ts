import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRecorderIPC, recorderCall } from '../src/network-service.js';
import { NetworkStore } from '../src/network-store.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
async function fixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'dv-recorder-test-'));
  cleanups.push(() => rm(directory, { recursive: true, force: true }));
  const store = new NetworkStore();
  let selected: string | undefined;
  const ipc = await createRecorderIPC({ profile: 'dv1', port: 0, directory, browserId: 'browser-test', store, ready: () => true, shutdown: () => {},
    selectedTab: () => selected, select: async tab => { await new Promise(resolve => setTimeout(resolve, 10)); selected = tab; } });
  cleanups.push(() => ipc.close());
  return { directory, store, ipc, call: (action: string, data = {}) => recorderCall('dv1', action, data, directory) };
}
describe('private shared recorder IPC', () => {
  it('acknowledges selection only after the tab recorder is ready', async () => {
    const f = await fixture();
    expect(await f.call('health')).toMatchObject({ ready: true, attached: false });
    expect((await f.call('health')).tabId).toBeUndefined();
    await f.call('select', { tabId: 'tab-b' });
    expect(await f.call('health')).toMatchObject({ attached: true, tabId: 'tab-b' });
    await expect(f.call('select')).rejects.toThrow('tab');
  });
  it('shares non-destructive reads and atomically clears entries and bodies across clients', async () => {
    const f = await fixture();
    const row = f.store.event('s', 'tab', 'Network.requestWillBeSent', { requestId: 'r', timestamp: 1, request: { url: 'https://test', method: 'GET' } })!;
    f.store.setBody(row.id, { body: 'secret', base64Encoded: false });
    expect((await f.call('list', { tabId: 'tab' })).entries).toHaveLength(1);
    expect((await f.call('list', { tabId: 'tab' })).entries[0].body).toBeUndefined();
    expect((await f.call('get', { id: row.id, tabId: 'tab', body: true })).body.body).toBe('secret');
    await f.call('clear');
    expect((await f.call('list')).entries).toEqual([]);
    await expect(f.call('get', { id: row.id })).rejects.toThrow('Request not found');
  });
  it('rejects unauthenticated and browser-origin requests', async () => {
    const f = await fixture();
    const descriptor = JSON.parse(await readFile(path.join(f.directory, 'dv1.json'), 'utf8'));
    async function status(headers: Record<string, string>) {
      return new Promise<number>(resolve => {
        const req = http.request({ host: '127.0.0.1', port: descriptor.port, method: 'POST', headers }, res => { res.resume(); resolve(res.statusCode!); });
        req.end(JSON.stringify({ action: 'health' }));
      });
    }
    expect(await status({})).toBe(403);
    expect(await status({ Authorization: `Bearer ${descriptor.token}`, Origin: 'https://hostile.test' })).toBe(403);
    expect((await f.call('health')).browserId).toBe('browser-test');
  });
  it('uses exclusive port binding so a second recorder cannot overwrite the owner descriptor', async () => {
    const f = await fixture();
    const before = await readFile(path.join(f.directory, 'dv1.json'), 'utf8');
    const descriptor = JSON.parse(before);
    await expect(createRecorderIPC({ profile: 'dv1', port: descriptor.port, directory: f.directory, browserId: 'other', store: new NetworkStore(), ready: () => true, shutdown: () => {} })).rejects.toThrow();
    expect(await readFile(path.join(f.directory, 'dv1.json'), 'utf8')).toBe(before);
  });
});
