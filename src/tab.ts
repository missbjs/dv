/** Per-page commands resolve live browser focus unless an explicit tab is named. */
export interface TabOptions {
  /** Tab ID to talk to. Defaults to the live focused/uniquely visible page. */
  tab?: string;
  /** Deprecated spelling of `--tab`, kept for callers that already use it. */
  tabId?: string;
}

/**
 * The tab a command should talk to, or undefined for "whichever tab dv would
 * pick by default". Tab IDs come from `dv tabs` and `dv status`.
 */
export function targetTab(options: TabOptions): string | undefined {
  // An empty value counts as "not named": '' would fail the tab lookup rather
  // than falling back to the default tab.
  return options.tab || options.tabId || undefined;
}
