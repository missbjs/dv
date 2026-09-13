export declare function getPortFromProfile(profileName: string): number;
/** Escape a string for safe use inside a JS single-quoted string literal */
export declare function escapeJsString(str: string): string;
/**
 * Split a `>>>` selector into its trimmed segments.
 *
 * Rejects empty segments (`"host >>>"`, `"a >>> >>> b"`). An empty segment used to
 * compile to `querySelector('')`, which throws `SyntaxError: The provided selector is
 * empty` deep inside the page — a typo in the selector should not look like a page bug.
 */
export declare function splitShadowSelector(selector: string): string[];
/**
 * Build a JS expression that traverses shadow DOM using `>>>` syntax.
 *
 * `>>>` separates each level: `"host >>> .inner"` becomes
 * `document.querySelector('host')?.shadowRoot?.querySelector('.inner')`
 *
 * The `accessor` is appended at the end (e.g. `outerHTML`, `textContent`). Pass an empty
 * accessor to get the bare element chain with the `?? ''` tail omitted — appending `?.`
 * with nothing after it is a syntax error.
 */
export declare function buildShadowExpression(selector: string, accessor: string): string;
/**
 * Build a JS expression that resolves to an element node (no accessor tail).
 *
 * Non-shadow: `document.querySelector('sel')`
 * Shadow `"host >>> .inner"`: `document.querySelector('host')?.shadowRoot?.querySelector('.inner')`
 *
 * The result may be `null`/`undefined` at runtime if any step misses; callers must guard.
 */
export declare function buildElementExpression(selector: string): string;
/**
 * Build a JS expression resolving to every match of the last `>>>` segment.
 *
 * `"host >>> .row"` becomes
 * `(document.querySelector('host')?.shadowRoot?.querySelectorAll('.row') ?? [])`.
 * Always array-like, never null, so callers can `Array.from(...)` it directly.
 */
export declare function buildShadowListExpression(selector: string): string;
/**
 * Build a JS expression that returns the center coordinates and dimensions
 * of an element selected via shadow-piercing `>>>` syntax.
 *
 * Returns `null` if the element is not found.
 */
export declare function buildShadowRectExpression(selector: string): string;
/** Check if a target string is a dv ref (e.g. "@e1", "@e1-2-3") */
export declare function isRef(target: string): boolean;
/**
 * Parse a comma-separated --props list into a clean array of property names.
 * Also splits on whitespace to handle PowerShell array-flattening (commas → spaces).
 */
export declare function parseProps(props?: string): string[];
/**
 * Convert a glob pattern to RegExp.
 * Supports: `*` (any chars except /), `**` (any chars), `?` (single char).
 */
export declare function globToRegex(pattern: string): RegExp;
//# sourceMappingURL=utils.d.ts.map