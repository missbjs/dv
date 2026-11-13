import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureNetworkRecorder, historyTab, stopNetworkRecorder, prepareTabCommand } from '../src/network-recorder.js';
const m = vi.hoisted(() => ({ call: vi.fn(), spawn: vi.fn(), targets: vi.fn(), version: vi.fn() }));
vi.mock('../src/network-service.js', async importOriginal => ({ ...await importOriginal<any>(), recorderCall: m.call }));
vi.mock('node:child_process', () => ({ spawn: m.spawn }));
vi.mock('axios', () => ({ default: { get: m.version } }));
vi.mock('../src/cdp.js', () => ({ CDPClient: class { getTargets = m.targets; async resolveCurrentTab() { return (await m.targets()).find((t: any) => t.focused) ?? (await m.targets())[0]; } } }));
beforeEach(() => { vi.clearAllMocks(); m.version.mockResolvedValue({ data: { webSocketDebuggerUrl: 'ws://localhost:9230/devtools/browser/test' } }); });
describe('recorder lifecycle', () => {
  it('reuses a healthy recorder for the same browser instead of spawning', async () => {
    m.call.mockResolvedValue({ ready: true, protocol: 1, profile: 'dv1', browserId: 'ws://127.0.0.1:9230/devtools/browser/test' });
    await ensureNetworkRecorder('dv1');
    expect(m.spawn).not.toHaveBeenCalled();
  });
  it('preserves explicit tab IDs, including tabs that have closed', async () => {
    expect(await historyTab('dv1', 'closed-tab')).toBe('closed-tab');
    expect(m.targets).not.toHaveBeenCalled();
    expect(m.call).not.toHaveBeenCalled();
    m.targets.mockResolvedValue([{ id: 'stale-first', type: 'page' }, { id: 'focused-tab', type: 'page', focused: true }]);
    expect(await historyTab('dv1')).toBe('focused-tab');
    expect(m.call).toHaveBeenCalledWith('dv1', 'select', { tabId: 'focused-tab' });
  });
  it('hands off explicit actions but not explicit read-only probes', async () => {
    m.call.mockResolvedValue({ ready: true, browserId: 'ws://127.0.0.1:9230/devtools/browser/test' });
    const readOptions = { profile: 'dv1', tab: 'background' };
    await prepareTabCommand('snapshot', readOptions);
    expect(m.call).not.toHaveBeenCalled();
    await prepareTabCommand('navigate', { profile: 'dv1', tab: 'background' });
    expect(m.call).toHaveBeenCalledWith('dv1', 'select', { tabId: 'background' });
    expect(m.targets).not.toHaveBeenCalled();
  });
  it('resolves and pins a fresh default target before the command acts', async () => {
    m.call.mockResolvedValue({ ready: true, browserId: 'ws://127.0.0.1:9230/devtools/browser/test' });
    m.targets.mockResolvedValue([{ id: 'live-focus', focused: true }]);
    const options: { profile: string; tab?: string } = { profile: 'dv1' };
    await prepareTabCommand('snapshot', options);
    expect(options.tab).toBe('live-focus');
    expect(m.call).toHaveBeenCalledWith('dv1', 'select', { tabId: 'live-focus' });
  });
  it('stops through authenticated IPC without killing a PID from a stale file', async () => {
    m.call.mockResolvedValue({ stopped: true });
    await stopNetworkRecorder('dv1');
    expect(m.call).toHaveBeenCalledWith('dv1', 'shutdown');
    expect(m.spawn).not.toHaveBeenCalled();
  });
});
