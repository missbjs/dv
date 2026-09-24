/** True when running as a standalone executable (dv.exe) rather than dist/*.js. */
export declare const isCompiled: boolean;
/**
 * Directory holding the six Chrome user-data-dirs, shared by the Node and
 * exe builds so both see the same logins and a reinstall never wipes them.
 * Override with DV_PROFILE_ROOT.
 */
export declare function profileRoot(): string;
/**
 * Move a profile folder from an older layout (dist/dvN under Node, profiles/dvN
 * beside dv.exe) into the shared root, so existing logins carry over. A no-op
 * once the shared folder exists. Throws if the move cannot complete (typically
 * Chrome is still running on the old folder) - the profile is never started
 * from the old location or from an empty folder in its place.
 */
export declare function migrateProfile(name: string): void;
/** User-data-dir for one profile, after migrating any older-layout folder. */
export declare function profileDir(name: string): string;
/** Command that re-invokes this CLI: dv.exe itself, or node + dist/cli.js. */
export declare function selfCommand(): {
    file: string;
    args: string[];
};
/**
 * When invoked as dv1…dv6 (DV_BIN_NAME set by the dvN.cmd / dvN.cjs shims),
 * pin the profile: drop any --profile the caller passed and inject the shim's
 * own, so dv3 can never act on dv1's Chrome. `profiles` takes no --profile.
 */
export declare function forceProfile(argv: string[]): void;
//# sourceMappingURL=runtime.d.ts.map