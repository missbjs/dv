/**
 * The tab a command should talk to, or undefined for "whichever tab dv would
 * pick by default". Tab IDs come from `dv tabs` and `dv status`.
 */
export function targetTab(options) {
    // An empty value counts as "not named": '' would fail the tab lookup rather
    // than falling back to the default tab.
    return options.tab || options.tabId || undefined;
}
//# sourceMappingURL=tab.js.map