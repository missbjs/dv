/** True when running as a standalone executable (dv.exe) rather than dist/*.js. */
export declare const isCompiled: boolean;
/**
 * Directory holding the six Chrome user-data-dirs, shared by the Node and
 * exe builds so both see the same logins and a reinstall never wipes them.
 * Override with DV_PROFILE_ROOT.
 */
export declare function profileRoot(): string;
/**
 * The old-layout folder that still has to be moved for this profile, or null
 * when nothing is pending (already migrated, never existed, or not dv1-dv6 -
 * only the six fixed names ever map to a folder, so a path-traversal string
 * is left for the caller's own validation to reject).
 */
export declare function pendingMigration(name: string): string | null;
/**
 * Move a pending old-layout profile folder into the shared root, so existing
 * logins carry over. A no-op when nothing is pending. Throws if the move
 * cannot complete - the profile is never started from the old location or
 * from an empty folder in its place. The caller must make sure no Chrome is
 * running on the profile first: Windows lets a folder be renamed while Chrome
 * has files open in it, which would strand the running browser.
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