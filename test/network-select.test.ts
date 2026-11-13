import { beforeEach, describe, expect, it, vi } from 'vitest';
import { select } from '../src/commands/select.js';
import { newPage } from '../src/commands/new.js';
const m = vi.hoisted(() => ({ ensure: vi.fn(), call: vi.fn(), connect: vi.fn(), send: vi.fn(), close: vi.fn(), events: [] as string[] }));
vi.mock('../src/network-recorder.js', () => ({ ensureNetworkRecorder: m.ensure }));
vi.mock('../src/network-service.js', () => ({ recorderCall: m.call }));
vi.mock('../src/cdp.js', () => ({ CDPClient: class {
  async getTargets() { return [{ id: 'tab-b', title: 'B', url: 'https://test', type: 'page' }]; }
  async newTab(url: string) { m.events.push(url); return { id: 'tab-b', title: 'B', url }; }
  async navigateAndWait(url: string) { m.events.push(url); }
  connect = m.connect; send = m.send; close = m.close;
} }));
beforeEach(() => { vi.clearAllMocks(); m.events.length = 0; m.call.mockImplementation(async () => { m.events.push('ready'); }); m.send.mockImplementation(async () => { m.events.push('front'); }); vi.spyOn(console, 'log').mockImplementation(() => {}); });
describe('select establishes live browser selection', () => {
  it('creates a blank tab and attaches before new-tab navigation starts', async () => {
    await newPage({ profile: 'dv1', url: 'https://test' });
    expect(m.events).toEqual(['about:blank', 'ready', 'front', 'https://test']);
    expect(m.close).toHaveBeenCalledOnce();
  });
  it('awaits recorder handoff, activates the tab, and closes the command session', async () => {
    await select({ profile: 'dv1', index: 1 });
    expect(m.call).toHaveBeenCalledWith('dv1', 'select', { tabId: 'tab-b' });
    expect(m.connect).toHaveBeenCalledWith('tab-b');
    expect(m.send).toHaveBeenCalledWith('Page.bringToFront');
    expect(m.events).toEqual(['ready', 'front']);
    expect(m.close).toHaveBeenCalledOnce();
  });
});
