import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { forceProfile, migrateProfile, pendingMigration } from '../src/runtime.js';
import { recorderPort } from '../src/network-service.js';

const names = ['dv7', 'dv10', 'dv24', 'dv25', 'dv100', 'dv128'];
const invalidNames = ['dv0', 'dv129', 'dv01', 'dv024', 'dv0128', 'DV7', 'dv7 ', '../dv7', 'dv7/../dv1', 'constructor', 'toString', '__proto__'];
const temporaryRoots: string[] = [];
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  for (const root of temporaryRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('fixed wrapper profile pinning', () => {
  it.each(names)('pins %s despite repeated split and equals overrides', name => {
    vi.stubEnv('DV_BIN_NAME', name);
    const argv = ['node', 'cli.js', 'status', '--profile', 'dv1', '--profile=dv6', '--profile', 'dv129', '--json'];
    forceProfile(argv);
    expect(argv).toEqual(['node', 'cli.js', 'status', '--profile', name, '--json']);
    forceProfile(argv);
    expect(argv).toEqual(['node', 'cli.js', 'status', '--profile', name, '--json']);
  });

  it.each(names)('does not inject a profile into profiles for %s', name => {
    vi.stubEnv('DV_BIN_NAME', name);
    const argv = ['node', 'cli.js', 'profiles', '--profile=dv1', '--profile', 'dv6'];
    forceProfile(argv);
    expect(argv).toEqual(['node', 'cli.js', 'profiles']);
  });

  it.each(names)('pins help-only and empty invocations for %s', name => {
    vi.stubEnv('DV_BIN_NAME', name);
    for (const rest of [[], ['--help']]) {
      const argv = ['node', 'cli.js', ...rest];
      forceProfile(argv);
      expect(argv).toEqual(['node', 'cli.js', ...rest, '--profile', name]);
    }
  });

  it.each(['', ...invalidNames])('ignores invalid wrapper name %s', name => {
    vi.stubEnv('DV_BIN_NAME', name);
    const argv = ['node', 'cli.js', 'status', '--profile', 'dv1'];
    forceProfile(argv);
    expect(argv).toEqual(['node', 'cli.js', 'status', '--profile', 'dv1']);
  });
});

describe('migration eligibility without user profile access', () => {
  function fixture(name: string) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dv-migration-test-'));
    temporaryRoots.push(root);
    const source = path.join(root, 'legacy', name);
    const targetRoot = path.join(root, 'profiles');
    fs.mkdirSync(source, { recursive: true });
    fs.writeFileSync(path.join(source, 'marker'), 'preserved login fixture');
    vi.stubEnv('DV_PROFILE_ROOT', targetRoot);
    const legacy = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src', name);
    const exists = fs.existsSync.bind(fs);
    const rename = fs.renameSync.bind(fs);
    // Never read or mutate a real legacy/user folder: map the module candidate
    // to a temporary source and report every other legacy candidate absent.
    const existsSpy = vi.spyOn(fs, 'existsSync').mockImplementation(candidate => {
      const value = String(candidate);
      if (value === legacy) return exists(source);
      if (value.startsWith(targetRoot + path.sep)) return exists(candidate);
      return false;
    });
    const renameSpy = vi.spyOn(fs, 'renameSync').mockImplementation((from, to) => {
      if (String(from) !== legacy) throw new Error('Unexpected migration source');
      rename(source, to);
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    return { source, target: path.join(targetRoot, name), legacy, existsSpy, renameSpy };
  }

  it.each(names)('migrates eligible %s exactly once into the shared root', name => {
    const f = fixture(name);
    expect(pendingMigration(name)).toBe(f.legacy);
    migrateProfile(name);
    expect(f.renameSpy).toHaveBeenCalledWith(f.legacy, f.target);
    expect(fs.readFileSync(path.join(f.target, 'marker'), 'utf8')).toBe('preserved login fixture');
    expect(pendingMigration(name)).toBeNull();
    migrateProfile(name);
    expect(f.renameSpy).toHaveBeenCalledTimes(1);
  });

  it('does not replace an existing shared-root profile', () => {
    const f = fixture('dv128');
    fs.mkdirSync(f.target, { recursive: true });
    expect(pendingMigration('dv128')).toBeNull();
    migrateProfile('dv128');
    expect(f.renameSpy).not.toHaveBeenCalled();
    expect(fs.readFileSync(path.join(f.source, 'marker'), 'utf8')).toBe('preserved login fixture');
  });

  it.each(invalidNames)('rejects %s before consulting the filesystem', name => {
    const exists = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    const rename = vi.spyOn(fs, 'renameSync');
    expect(pendingMigration(name)).toBeNull();
    migrateProfile(name);
    expect(exists).not.toHaveBeenCalled();
    expect(rename).not.toHaveBeenCalled();
  });
});

describe('recorder port registry boundaries', () => {
  it('assigns all 128 unique ports at Chrome port + 10000', () => {
    const ports = Array.from({ length: 128 }, (_, i) => recorderPort(`dv${i + 1}`));
    expect(ports).toEqual(Array.from({ length: 128 }, (_, i) => 19230 + i));
    expect(new Set(ports).size).toBe(128);
  });

  it.each(invalidNames)('rejects invalid recorder profile %s', name => {
    expect(() => recorderPort(name)).toThrow('Invalid recorder profile');
  });
});
