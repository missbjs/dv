/** True when running as a standalone executable (dv.exe) rather than dist/*.js. */
export declare const isCompiled: boolean;
/**
 * Directory holding the six Chrome user-data-dirs. Under Node it is dist/ (as
 * before); in dv.exe it is `profiles/` beside the executable, so the six
 * profiles live at one fixed place no matter where dv is invoked from.
 */
export declare function profileRoot(): string;
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