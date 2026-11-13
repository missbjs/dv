import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';

const mocks = vi.hoisted(() => ({ spawn: vi.fn(), selfCommand: vi.fn() }));
vi.mock('child_process', () => ({ spawn: mocks.spawn }));
vi.mock('../src/runtime.js', () => ({ selfCommand: mocks.selfCommand }));
import { batch } from '../src/commands/batch.js';

beforeEach(() => {
  mocks.spawn.mockReset();
  mocks.selfCommand.mockReset().mockReturnValue({ file: '/fixture/node', args: ['/fixture/cli.js'] });
  mocks.spawn.mockImplementation(() => {
    const child = Object.assign(new EventEmitter(), { stdout: new EventEmitter(), stderr: new EventEmitter() });
    queueMicrotask(() => child.emit('close', 0));
    return child;
  });
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('batch fixed-profile subprocess routing', () => {
  it.each(['dv7', 'dv10', 'dv24', 'dv25', 'dv100', 'dv128', '7', '10', '24', '25', '100', '128'])(
    'routes %s through the same CLI with the canonical fixed profile', async profile => {
      await batch({ profile, commands: ['status --json', 'snapshot'] });
      const expectedBin = profile.startsWith('dv') ? profile : `dv${profile}`;
      expect(mocks.spawn).toHaveBeenCalledTimes(2);
      expect(mocks.spawn).toHaveBeenNthCalledWith(1, '/fixture/node', ['/fixture/cli.js', 'status', '--json'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: expect.objectContaining({ DV_BIN_NAME: expectedBin }),
      });
      expect(mocks.spawn).toHaveBeenNthCalledWith(2, '/fixture/node', ['/fixture/cli.js', 'snapshot'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: expect.objectContaining({ DV_BIN_NAME: expectedBin }),
      });
    },
  );

  it('honors a valid bin override without resolving an external executable', async () => {
    await batch({ profile: 'dv1', bin: 'dv128', commands: ['status'] });
    expect(mocks.spawn).toHaveBeenCalledWith('/fixture/node', ['/fixture/cli.js', 'status'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: expect.objectContaining({ DV_BIN_NAME: 'dv128' }),
    });
  });

  it.each(['dv0', 'dv129', 'dv01', 'dv024', 'dv0128', '129', '0128', 'DV7', '../dv7', 'constructor', 'toString', '__proto__'])(
    'rejects invalid profile or override %s before spawning', async name => {
      await expect(batch({ profile: name, commands: ['status'] })).rejects.toThrow('Unknown dv profile binary');
      await expect(batch({ profile: 'dv1', bin: name, commands: ['status'] })).rejects.toThrow('Unknown dv profile binary');
      expect(mocks.spawn).not.toHaveBeenCalled();
    },
  );
});
