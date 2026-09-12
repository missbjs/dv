/** Window metrics read out of a single tab, all in CSS pixels. */
export interface ViewportMetrics {
    innerWidth: number;
    innerHeight: number;
    outerWidth: number;
    outerHeight: number;
    devicePixelRatio: number;
}
export interface ViewportReport extends ViewportMetrics {
    /** True when the numbers only make sense with a device-metrics override in place. */
    emulated: boolean;
    /** Why it was flagged — undefined when the viewport looks like a real window. */
    reason?: string;
    /**
     * False when the metrics cannot support a verdict either way — a tab that has
     * never been in front reports its window size as 0, and "no window to compare
     * against" must not read as "no override".
     */
    conclusive: boolean;
    /** Why no verdict was possible — undefined when `conclusive` is true. */
    inconclusiveReason?: string;
}
/** The expression evaluated in the page. Kept in one place so tests can reuse it. */
export declare const VIEWPORT_METRICS_EXPRESSION = "JSON.stringify([innerWidth,innerHeight,outerWidth,outerHeight,devicePixelRatio])";
/**
 * Decide whether a tab's viewport is under an `Emulation.setDeviceMetricsOverride`.
 *
 * There is no CDP getter for "is an override active", but an override changes the
 * inner size while leaving the real window bounds — and therefore `outerWidth` /
 * `outerHeight` — untouched, so the mismatch is the signal.
 *
 * Both rules are deliberately conservative. Docked DevTools shrinks the viewport
 * too: docked to the side it eats width only, docked to the bottom it eats height
 * only, so requiring *both* dimensions to shrink keeps that from reading as
 * emulation. The cost is that an override which happens to match the real window
 * in one dimension is not detected.
 */
export declare function detectEmulatedViewport(m: ViewportMetrics): ViewportReport;
/**
 * Lines to print after installing an override that lives and dies with the CDP
 * connection. dv connects once per command, so by the time the next command
 * runs the override is gone — a bare "✓ override set" reads as a promise the
 * tool cannot keep. The viewport is the single exception: Chrome keeps the
 * resized widget after the session goes away, which is why `reset` exists.
 */
export declare function sessionScopedNote(what: string): string[];
/** Parse the JSON payload produced by VIEWPORT_METRICS_EXPRESSION. */
export declare function parseViewportMetrics(value: unknown): ViewportMetrics | null;
/**
 * Read one tab's viewport metrics over a short-lived CDP connection.
 * Returns null if the tab can't be probed (closed, restricted, or too slow) —
 * a tab that won't answer must never take `status` down with it.
 */
export declare function probeViewport(port: number, tabId: string, timeoutMs?: number): Promise<ViewportReport | null>;
//# sourceMappingURL=emulation.d.ts.map