import { CDPClient } from './cdp.js';

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

/**
 * Widest plausible gap between innerWidth and outerWidth on a real window:
 * a scrollbar (~15px) plus window borders. Measured baseline on Windows: 16px.
 */
const WIDTH_CHROME_MAX = 40;
/**
 * Tallest plausible gap between innerHeight and outerHeight: tab strip,
 * omnibox, bookmarks bar and borders. Measured baseline on Windows: 95px;
 * 200 leaves room for a bookmarks bar and a larger UI scale.
 */
const HEIGHT_CHROME_MAX = 200;
/** Slack for the "viewport is bigger than the window" check. */
const OVERSIZE_SLACK = 8;

/** The expression evaluated in the page. Kept in one place so tests can reuse it. */
export const VIEWPORT_METRICS_EXPRESSION =
  'JSON.stringify([innerWidth,innerHeight,outerWidth,outerHeight,devicePixelRatio])';

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
export function detectEmulatedViewport(m: ViewportMetrics): ViewportReport {
  const base = {
    ...m,
    emulated: false as boolean,
    reason: undefined as string | undefined,
    conclusive: true,
    inconclusiveReason: undefined as string | undefined,
  };

  // No usable window size (a tab that has never been in front reports 0, as do
  // some headless/embedded targets) — there is nothing to compare against, so
  // say so rather than reporting a clean bill of health.
  if (!m.outerWidth || !m.outerHeight || !m.innerWidth || !m.innerHeight) {
    const zeroed = (['innerWidth', 'innerHeight', 'outerWidth', 'outerHeight'] as const).filter(
      (k) => !m[k]
    );
    return {
      ...base,
      emulated: false,
      conclusive: false,
      inconclusiveReason: `${zeroed.join(', ')} reported as 0 — a tab that has never been in front has no window size to compare against`,
    };
  }

  const widthGap = m.outerWidth - m.innerWidth;
  const heightGap = m.outerHeight - m.innerHeight;

  // A viewport cannot be bigger than the window that contains it.
  if (widthGap < -OVERSIZE_SLACK || heightGap < -OVERSIZE_SLACK) {
    return { ...base, emulated: true, reason: 'viewport is larger than the window' };
  }

  if (widthGap > WIDTH_CHROME_MAX && heightGap > HEIGHT_CHROME_MAX) {
    return {
      ...base,
      emulated: true,
      reason: 'viewport is far smaller than the window in both dimensions',
    };
  }

  return { ...base, emulated: false, reason: undefined };
}

/**
 * Lines to print after installing an override that lives and dies with the CDP
 * connection. dv connects once per command, so by the time the next command
 * runs the override is gone — a bare "✓ override set" reads as a promise the
 * tool cannot keep. The viewport is the single exception: Chrome keeps the
 * resized widget after the session goes away, which is why `reset` exists.
 */
export function sessionScopedNote(what: string): string[] {
  return [
    `The ${what} override ends when this command exits: CDP overrides belong to the`,
    'connection that set them, and dv connects once per command. Only the viewport',
    'size survives — everything else is gone by the next command.',
  ];
}

/** Parse the JSON payload produced by VIEWPORT_METRICS_EXPRESSION. */
export function parseViewportMetrics(value: unknown): ViewportMetrics | null {
  if (typeof value !== 'string') return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length < 5) return null;
  const nums = parsed.slice(0, 5).map(Number);
  if (nums.some((n) => !Number.isFinite(n))) return null;
  const [innerWidth, innerHeight, outerWidth, outerHeight, devicePixelRatio] = nums;
  return { innerWidth, innerHeight, outerWidth, outerHeight, devicePixelRatio };
}

/**
 * Read one tab's viewport metrics over a short-lived CDP connection.
 * Returns null if the tab can't be probed (closed, restricted, or too slow) —
 * a tab that won't answer must never take `status` down with it.
 */
export async function probeViewport(
  port: number,
  tabId: string,
  timeoutMs: number = 2500
): Promise<ViewportReport | null> {
  const client = new CDPClient(port);
  let timer: NodeJS.Timeout | undefined;
  try {
    const probe = (async () => {
      await client.connect(tabId);
      const result = await client.evaluate(VIEWPORT_METRICS_EXPRESSION);
      return parseViewportMetrics(result?.result?.value);
    })();

    // clearTimeout in `finally` matters: a live timer would keep the CLI
    // process alive for the full timeout after a fast probe.
    const deadline = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), timeoutMs);
    });

    const metrics = await Promise.race([probe, deadline]);
    return metrics ? detectEmulatedViewport(metrics) : null;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
    await client.close();
  }
}
