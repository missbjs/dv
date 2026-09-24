import path from 'path';
import { fileURLToPath } from 'url';

// This module's own directory: dist/ under Node, a virtual path inside a
// `bun build --compile` executable.
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

/** True when running as a standalone executable (dv.exe) rather than dist/*.js. */
export const isCompiled = /[\\/](~BUN|\$bunfs)[\\/]/.test(MODULE_DIR);

const FORCED_PROFILES = ['dv1', 'dv2', 'dv3', 'dv4', 'dv5', 'dv6'];

/**
 * Directory holding the six Chrome user-data-dirs. Under Node it is dist/ (as
 * before); in dv.exe it is `profiles/` beside the executable, so the six
 * profiles live at one fixed place no matter where dv is invoked from.
 */
export function profileRoot(): string {
  return isCompiled ? path.join(path.dirname(process.execPath), 'profiles') : MODULE_DIR;
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
