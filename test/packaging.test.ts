import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { listProfiles } from '../src/profiles.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const readJSON = (file: string) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const normalize = (bins: Record<string, string>) => Object.fromEntries(
  Object.entries(bins).map(([name, file]) => [name, file.replace(/^\.\//, '')]),
);

describe('fixed-profile package entry points', () => {
  it('keeps package and lockfile bins identical to the 128-profile registry', () => {
    const expected = Object.fromEntries(listProfiles().map(({ name }) => [name, `bin/${name}.cjs`]));
    expect(Object.keys(expected)).toHaveLength(128);
    expect(normalize(readJSON('package.json').bin)).toEqual(expected);
    expect(normalize(readJSON('package-lock.json').packages[''].bin)).toEqual(expected);
    expect(expected).not.toHaveProperty('dv');
    expect(expected).not.toHaveProperty('dv129');
  });

  it.each(Array.from({ length: 128 }, (_, i) => `dv${i + 1}`))(
    '%s wrapper literally pins its own name before loading the CLI', name => {
      const source = readFileSync(path.join(root, 'bin', `${name}.cjs`), 'utf8');
      expect(source).toContain(`process.env.DV_BIN_NAME = '${name}';`);
      const env = { DV_BIN_NAME: 'dv1' };
      const require = vi.fn((file: string) => {
        expect(env.DV_BIN_NAME).toBe(name);
        expect(file).toBe('../dist/cli.js');
      });
      // Execute just the wrapper with a stub loader: never import the real CLI,
      // spawn a subprocess, or access any Chrome profile.
      runInNewContext(source, { process: { env }, require });
      expect(require).toHaveBeenCalledExactlyOnceWith('../dist/cli.js');
      expect(env.DV_BIN_NAME).toBe(name);
    },
  );
});
