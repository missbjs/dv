/**
 * Every dv command talks to one tab. Without a way to name it, a command always
 * hits the first content tab in `/json/list` — and that order shifts as tabs are
 * activated, so on a profile with more than one tab open the target is not
 * something the caller can rely on. These options make the target explicit.
 */
export interface TabOptions {
    /** Tab ID to talk to. Defaults to the first content tab. */
    tab?: string;
    /** Deprecated spelling of `--tab`, kept for callers that already use it. */
    tabId?: string;
}
/**
 * The tab a command should talk to, or undefined for "whichever tab dv would
 * pick by default". Tab IDs come from `dv tabs` and `dv status`.
 */
export declare function targetTab(options: TabOptions): string | undefined;
//# sourceMappingURL=tab.d.ts.map