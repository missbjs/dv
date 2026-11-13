import { describe, expect, it, vi } from 'vitest';
import { CDPClient } from '../src/cdp.js';
const tabs = ['a', 'b'].map(id => ({ id, type: 'page', title: id, url: 'https://test', webSocketDebuggerUrl: `ws://test/${id}` }));
describe('live default tab resolution', () => {
  it('prefers focused browser tab over target order and closes every probe', async () => {
    const client = new CDPClient(9230);
    const connect = vi.spyOn(CDPClient.prototype, 'connect').mockResolvedValue();
    const evaluate = vi.spyOn(CDPClient.prototype, 'evaluate').mockResolvedValueOnce({ result: { value: { focused: false, visible: false } } }).mockResolvedValueOnce({ result: { value: { focused: true, visible: true } } });
    const close = vi.spyOn(CDPClient.prototype, 'close').mockResolvedValue();
    try { expect((await client.resolveCurrentTab(tabs)).id).toBe('b'); expect(connect.mock.calls).toEqual([['a'], ['b']]); expect(close).toHaveBeenCalledTimes(2); }
    finally { connect.mockRestore(); evaluate.mockRestore(); close.mockRestore(); }
  });
  it('accepts a uniquely visible tab when browser is unfocused', async () => {
    const connect = vi.spyOn(CDPClient.prototype, 'connect').mockResolvedValue();
    const evaluate = vi.spyOn(CDPClient.prototype, 'evaluate').mockResolvedValueOnce({ result: { value: { focused: false, visible: false } } }).mockResolvedValueOnce({ result: { value: { focused: false, visible: true } } });
    try { expect((await new CDPClient(9230).resolveCurrentTab(tabs)).id).toBe('b'); }
    finally { connect.mockRestore(); evaluate.mockRestore(); }
  });
  it('fails safely for multiple visible windows and closes failed probes', async () => {
    const connect = vi.spyOn(CDPClient.prototype, 'connect').mockResolvedValue();
    const evaluate = vi.spyOn(CDPClient.prototype, 'evaluate').mockResolvedValue({ result: { value: { focused: false, visible: true } } });
    const close = vi.spyOn(CDPClient.prototype, 'close').mockResolvedValue();
    try { await expect(new CDPClient(9230).resolveCurrentTab(tabs)).rejects.toThrow('--tab'); expect(close).toHaveBeenCalledTimes(2); }
    finally { connect.mockRestore(); evaluate.mockRestore(); close.mockRestore(); }
  });
  it('accepts a sole content tab without probing', async () => {
    expect((await new CDPClient(9230).resolveCurrentTab(tabs.slice(1))).id).toBe('b');
  });
});
