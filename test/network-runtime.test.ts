import { describe, it, expect } from 'vitest';
import { selfCommand } from '../src/runtime.js';
import { existsSync } from 'node:fs';
describe('recorder self-launch', () => {
  it('selects an existing CLI entry when running TypeScript source', () => {
    const command = selfCommand();
    expect(command.file).toBe(process.execPath);
    expect(command.args.at(-1)).toMatch(/cli\.ts$/);
    expect(existsSync(command.args.at(-1)!)).toBe(true);
    expect(command.args).toContain('--import');
    expect(command.args[1]).toMatch(/tsx[\\/]/);
  });
});
