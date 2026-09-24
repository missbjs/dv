/** True when running as a standalone executable (dv.exe) rather than dist/*.js. */
export declare const isCompiled: boolean;
/**
 * Directory holding the six Chrome user-data-dirs, shared by the Node and
 * exe builds so both see the same logins and a reinstall never wipes them.
 * Override with DV_PROFILE_ROOT.
 */
export declare function profileRoot(): string;
/**
 * User-data-dir for one profile. The first time a profile is needed, any
 * pre-existing folder from an older layout is moved into the shared root so
 * existing logins carry over. If the move fails (e.g. Chrome still has it
 * open) the old folder keeps being used rather than silently starting empty.
 */
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