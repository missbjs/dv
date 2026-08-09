/**
 * Shared machine-readable output options. Every data-returning command mixes
 * these in so `--json` / `--yaml` behave identically across the whole CLI.
 * Human-readable output remains the default when neither flag is set.
 */
export interface OutputOptions {
    json?: boolean;
    yaml?: boolean;
}
/** True when the user asked for a structured (machine) format. */
export declare function wantsStructured(options: OutputOptions): boolean;
/**
 * Serialize `data` in the requested structured format.
 * `--yaml` takes precedence if both are somehow set; otherwise JSON.
 * Callers should gate this behind `wantsStructured`.
 */
export declare function renderStructured(data: unknown, options: OutputOptions): string;
/**
 * If a structured format was requested, print `data` in it and return true.
 * Otherwise return false so the caller falls through to human-readable output.
 *
 *   if (printStructured(data, options)) return;
 *   // ...human-readable rendering here
 */
export declare function printStructured(data: unknown, options: OutputOptions): boolean;
//# sourceMappingURL=output.d.ts.map