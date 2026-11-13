import { describe, it, expect, vi, beforeEach } from 'vitest';
import { start } from '../src/commands/start.js';
import { ensureChromeRunning } from '../src/ensureChrome.js';
import { stop } from '../src/commands/stop.js';
const m = vi.hoisted(() => ({ history: vi.fn(async () => 'focused'), ensure: vi.fn(), stop: vi.fn(), targets: vi.fn(async () => []), spawn: vi.fn(), migration: vi.fn(() => null) }));
vi.mock('../src/network-recorder.js', () => ({ ensureNetworkRecorder: m.ensure, stopNetworkRecorder: m.stop, historyTab: m.history }));
vi.mock('../src/cdp.js', () => ({ CDPClient: class { getTargets = m.targets; connect = vi.fn(); clearDeviceMetricsOverride = vi.fn(); close = vi.fn(); } }));
vi.mock('../src/runtime.js', () => ({ pendingMigration: m.migration, migrateProfile: vi.fn(), profileDir: vi.fn() }));
vi.mock('child_process', () => ({ spawn: m.spawn, execFile: (_f: string, _a: any, cb: any) => cb(null, { stdout: '' }) }));
beforeEach(() => { vi.clearAllMocks(); vi.spyOn(console, 'log').mockImplementation(() => {}); });
describe('network capture starts with Chrome', () => {
  it('start ensures the recorder even when Chrome was already running', async () => {
    m.targets.mockResolvedValueOnce([{ type: 'page' }] as any);
    await start({ profile: 'dv1' });
    expect(m.history).toHaveBeenCalledWith('dv1');
    expect(m.ensure).toHaveBeenCalledWith('dv1');
    expect(m.spawn).not.toHaveBeenCalled();
  });
  it('fresh start awaits tab attachment outside best-effort emulation cleanup', async () => {
    m.targets.mockRejectedValueOnce(new Error('not running'));
    await start({ profile: 'dv1' });
    expect(m.history).toHaveBeenCalledWith('dv1');
  });
  it('fresh start propagates attachment failure instead of claiming readiness', async () => {
    m.targets.mockRejectedValueOnce(new Error('not running'));
    m.history.mockRejectedValueOnce(new Error('Network.enable failed'));
    await expect(start({ profile: 'dv1' })).rejects.toThrow('Network.enable failed');
  });
  it('auto-start helper ensures recorder before navigation can proceed', async () => {
    await ensureChromeRunning('dv1');
    expect(m.ensure).toHaveBeenCalledWith('dv1');
  });
  it('stop cleans up the recorder even if Chrome has already exited', async () => {
    await stop({ profile: 'dv1' });
    expect(m.stop).toHaveBeenCalledWith('dv1');
  });
});
