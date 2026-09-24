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
export function profileRoot() {
    if (process.env.DV_PROFILE_ROOT)
        return path.resolve(process.env.DV_PROFILE_ROOT);
    if (process.platform === 'win32') {
        return path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), 'AppData', 'Local'), 'dv', 'profiles');
    }
    return path.join(process.env.XDG_DATA_HOME ?? path.join(os.homedir(), '.local', 'share'), 'dv', 'profiles');
}
/** Where earlier builds kept profiles: dist/ under Node, profiles/ beside dv.exe. */
function legacyRoots() {
    return [MODULE_DIR, path.join(path.dirname(process.execPath), 'profiles')];
}
/**
 * User-data-dir for one profile. The first time a profile is needed, any
 * pre-existing folder from an older layout is moved into the shared root so
 * existing logins carry over. If the move fails (e.g. Chrome still has it
 * open) the old folder keeps being used rather than silently starting empty.
 */
export function profileDir(name) {
    const target = path.join(profileRoot(), name);
    if (fs.existsSync(target))
        return target;
    for (const root of legacyRoots()) {
        const legacy = path.join(root, name);
        if (path.resolve(legacy) === path.resolve(target) || !fs.existsSync(legacy))
            continue;
        try {
            fs.mkdirSync(path.dirname(target), { recursive: true });
            try {
                fs.renameSync(legacy, target);
            }
            catch (e) {
                if (e.code !== 'EXDEV')
                    throw e;
                fs.cpSync(legacy, target, { recursive: true });
                fs.rmSync(legacy, { recursive: true, force: true });
            }
            console.error(`dv: moved ${name} profile to ${target}`);
            return target;
        }
        catch (e) {
            console.error(`dv: could not move ${legacy} to ${target} (${e.message}); using it in place`);
            return legacy;
        }
    }
    return target;
}
/** Command that re-invokes this CLI: dv.exe itself, or node + dist/cli.js. */
export function selfCommand() {
    return isCompiled
        ? { file: process.execPath, args: [] }
        : { file: process.execPath, args: [path.join(MODULE_DIR, 'cli.js')] };
}
/**
 * When invoked as dv1…dv6 (DV_BIN_NAME set by the dvN.cmd / dvN.cjs shims),
 * pin the profile: drop any --profile the caller passed and inject the shim's
 * own, so dv3 can never act on dv1's Chrome. `profiles` takes no --profile.
 */
export function forceProfile(argv) {
    const forced = process.env.DV_BIN_NAME;
    if (!forced || !FORCED_PROFILES.includes(forced))
        return;
    for (let i = 2; i < argv.length;) {
        if (argv[i] === '--profile')
            argv.splice(i, 2);
        else if (argv[i].startsWith('--profile='))
            argv.splice(i, 1);
        else
            i++;
    }
    const subIdx = argv.findIndex((a, i) => i > 1 && !a.startsWith('-'));
    if (subIdx >= 0 && argv[subIdx] === 'profiles')
        return;
    if (subIdx >= 0)
        argv.splice(subIdx + 1, 0, '--profile', forced);
    else
        argv.push('--profile', forced);
}
//# sourceMappingURL=runtime.js.map