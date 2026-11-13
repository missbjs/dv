import { describe, it, expect, vi, beforeEach } from 'vitest';
import { network } from '../src/commands/network.js';
import { request } from '../src/commands/request.js';
import { har } from '../src/commands/har.js';
const mocks = vi.hoisted(() => ({ ensure: vi.fn(), call: vi.fn(), write: vi.fn(), tab: vi.fn(async (_profile: string, tab?: string) => tab ?? 'tab-a') }));
vi.mock('../src/network-recorder.js', () => ({ ensureNetworkRecorder: mocks.ensure, historyTab: mocks.tab }));
vi.mock('../src/network-service.js', () => ({ recorderCall: mocks.call }));
vi.mock('fs', () => ({ promises: { writeFile: mocks.write } }));
beforeEach(() => { vi.clearAllMocks(); vi.spyOn(console, 'log').mockImplementation(() => {}); });
describe('network history commands', () => {
  it('lists shared history without clearing it, with pure structured output', async () => {
    mocks.call.mockResolvedValue({ entries: [{ id: 'saved:1', requestId: 'r1', tabId: 'tab-a', method: 'GET', url: 'https://test', state: 'finished' }] });
    await network({ profile: 'dv1', json: true });
    expect(mocks.ensure).toHaveBeenCalledWith('dv1');
    expect(mocks.call).toHaveBeenCalledExactlyOnceWith('dv1', 'list', { tabId: 'tab-a' });
    expect(JSON.parse(vi.mocked(console.log).mock.calls[0][0])[0].id).toBe('saved:1');
  });
  it('clears only the current tab by default, including saved bodies', async () => {
    mocks.call.mockResolvedValue({ cleared: true });
    await network({ profile: 'dv1', clear: true });
    expect(mocks.call).toHaveBeenCalledExactlyOnceWith('dv1', 'clear', { tabId: 'tab-a' });
    expect(mocks.tab).toHaveBeenCalledWith('dv1', undefined);
  });
  it('clears a named historical tab without losing its restriction', async () => {
    mocks.call.mockResolvedValue({ cleared: true });
    await network({ profile: 'dv1', tab: 'closed-tab', clear: true });
    expect(mocks.call).toHaveBeenCalledExactlyOnceWith('dv1', 'clear', { tabId: 'closed-tab' });
  });
  it('retrieves saved response bodies in structured request output', async () => {
    mocks.call.mockResolvedValue({ id: 'saved:1', bodyState: 'available', body: { body: 'hello', base64Encoded: false } });
    await request({ profile: 'dv1', tab: 'tab-a', id: 'saved:1', body: true, json: true });
    expect(mocks.call).toHaveBeenCalledWith('dv1', 'get', { id: 'saved:1', tabId: 'tab-a', body: true });
    expect(JSON.parse(vi.mocked(console.log).mock.calls[0][0]).body.body).toBe('hello');
  });
  it('infers a saved opaque request’s tab without switching live capture', async () => {
    const id = '11111111-1111-4111-8111-111111111111:2';
    mocks.call.mockResolvedValue({ id, tabId: 'old-tab', bodyState: 'unavailable' });
    await request({ profile: 'dv1', id, json: true });
    expect(mocks.call).toHaveBeenCalledWith('dv1', 'get', { id, tabId: undefined, body: undefined });
    expect(mocks.tab).not.toHaveBeenCalled();
  });
  it('exports actual request methods, response status, wall time and binary body encoding', async () => {
    mocks.call.mockResolvedValue({ entries: [{ id: 'saved:1', tabId: 'tab-a', requestId: 'r', loaderId: 'l', timestamp: 10, wallTime: 1700000000, endTimestamp: 11, method: 'POST', url: 'https://test/a?q=1', requestHeaders: { Accept: 'text/plain' }, postData: 'hi', responseHeaders: { 'Content-Type': 'text/plain' }, status: 201, mimeType: 'text/plain', state: 'finished', bodyState: 'available', body: { body: 'aGk=', base64Encoded: true } }] });
    await har({ profile: 'dv1', tab: 'tab-a', output: 'out.har' });
    const entry = JSON.parse(mocks.write.mock.calls[0][1]).log.entries[0];
    expect(entry.startedDateTime).toBe('2023-11-14T22:13:20.000Z');
    expect(entry.request.method).toBe('POST');
    expect(entry.response.status).toBe(201);
    expect(entry.response.content.encoding).toBe('base64');
    expect(entry.time).toBe(1000);
  });
});
