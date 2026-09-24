import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

// This module's own directory: dist/ under Node, a virtual path inside a
// `bun build --compile` executable.
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

/** True when running as a standalone executable (dv.exe) rather than dist/*.js. */
export const isCompiled = /[\\/](~BUN|\$bunfs)[\\/]/.test(MODULE_DIR);

const FORCED_PROFILES = ['dv1', 'dv2', 'dv3', 'dv4', 'dv5', 'dv6'];

/**
 * Directory holding the six Chrome user-data-dirs, shared by the Node and
 * exe builds so both see the same logins and a reinstall never wipes them.
 * Override with DV_PROFILE_ROOT.
 */
export function profileRoot(): string {
  if (process.env.DV_PROFILE_ROOT) return path.resolve(process.env.DV_PROFILE_ROOT);
  if (process.platform === 'win32') {
    return path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local'), 'dv', 'profiles');
  }
  return path.join(process.env.XDG_DATA_HOME ?? path.join(os.homedir(), '.local', 'share'), 'dv', 'profiles');
}

/** Where earlier builds kept profiles: dist/ under Node, profiles/ beside dv.exe. */
function legacyRoots(): string[] {
  return [MODULE_DIR, path.join(path.dirname(process.execPath), 'profiles')];
}

/**
 * Move a profile folder from an older layout (dist/dvN under Node, profiles/dvN
 * beside dv.exe) into the shared root, so existing logins carry over. A no-op
 * once the shared folder exists. Throws if the move cannot complete (typically
 * Chrome is still running on the old folder) - the profile is never started
 * from the old location or from an empty folder in its place.
 */
export function migrateProfile(name: string): void {
  // Only the six fixed names ever map to a folder; anything else (e.g. a path-traversal
  // string) is left for the caller's own validation to reject.
  if (!FORCED_PROFILES.includes(name)) return;
  const target = path.join(profileRoot(), name);
  if (fs.existsSync(target)) return;
  for (const root of legacyRoots()) {
    const legacy = path.join(root, name);
    if (path.resolve(legacy) === path.resolve(target) || !fs.existsSync(legacy)) continue;
    try {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      try {
        fs.renameSync(legacy, target);
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'EXDEV') throw e;
        // Different drive: copy beside the target first so a partial copy is
        // never mistaken for the real profile, then swap it in.
        const partial = target + '.migrating';
        fs.rmSync(partial, { recursive: true, force: true });
        try {
          fs.cpSync(legacy, partial, { recursive: true });
          fs.renameSync(partial, target);
        } catch (copyErr) {
          fs.rmSync(partial, { recursive: true, force: true });
          throw copyErr;
        }
        try {
          fs.rmSync(legacy, { recursive: true, force: true });
        } catch {
          console.error(`dv: ${name} migrated, but could not delete the old copy at ${legacy}`);
        }
      }
      console.error(`dv: moved ${name} profile to ${target}`);
      return;
    } catch (e) {
      throw new Error(
        `cannot move ${name} profile from ${legacy} to ${target}: ${(e as Error).message}. ` +
        `If Chrome is running on ${name}, run "${name} stop" (or close it) and try again.`,
      );
    }
  }
}

/** User-data-dir for one profile, after migrating any older-layout folder. */
export function profileDir(name: string): string {
  migrateProfile(name);
  return path.join(profileRoot(), name);
}

/** Command that re-invokes this CLI: dv.exe itself, or node + dist/cli.js. */
export function selfCommand(): { file: string; args: string[] } {
  return isCompiled
    ? { file: process.execPath, args: [] }
    : { file: process.execPath, args: [path.join(MODULE_DIR, 'cli.js')] };
}

/**
 * When invoked as dv1…dv6 (DV_BIN_NAME set by the dvN.cmd / dvN.cjs shims),
 * pin the profile: drop any --profile the caller passed and inject the shim's
 * own, so dv3 can never act on dv1's Chrome. `profiles` takes no --profile.
 */
export function forceProfile(argv: string[]): void {
  const forced = process.env.DV_BIN_NAME;
  if (!forced || !FORCED_PROFILES.includes(forced)) return;

  for (let i = 2; i < argv.length; ) {
    if (argv[i] === '--profile') argv.splice(i, 2);
    else if (argv[i].startsWith('--profile=')) argv.splice(i, 1);
    else i++;
  }

  const subIdx = argv.findIndex((a, i) => i > 1 && !a.startsWith('-'));
  if (subIdx >= 0 && argv[subIdx] === 'profiles') return;
  if (subIdx >= 0) argv.splice(subIdx + 1, 0, '--profile', forced);
  else argv.push('--profile', forced);
}
