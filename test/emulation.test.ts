import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  detectEmulatedViewport,
  parseViewportMetrics,
  probeViewport,
  VIEWPORT_METRICS_EXPRESSION,
  ViewportMetrics,
  sessionScopedNote,
} from '../src/emulation.js';
import { MockCDPServer } from './mock-cdp-server.js';
import { getTestPort } from './test-profiles.js';
import { clearHints } from '../src/commands/status.js';

/**
 * Baseline numbers measured on a real headed Chrome 152 window on Windows:
 * inner 1131x1146, outer 1147x1241 (16px of scrollbar/border, 95px of chrome).
 */
const REAL_WINDOW: ViewportMetrics = {
  innerWidth: 1131,
  innerHeight: 1146,
  outerWidth: 1147,
  outerHeight: 1241,
  devicePixelRatio: 1,
};

const metrics = (patch: Partial<ViewportMetrics>): ViewportMetrics => ({ ...REAL_WINDOW, ...patch });

describe('detectEmulatedViewport', () => {
  it('does not flag a real window', () => {
    const report = detectEmulatedViewport(REAL_WINDOW);
    expect(report.emulated).toBe(false);
    expect(report.reason).toBeUndefined();
  });

  it('flags an override smaller than the window in both dimensions', () => {
    // `resize 900 700` against the baseline window
    const report = detectEmulatedViewport(metrics({ innerWidth: 900, innerHeight: 700 }));
    expect(report.emulated).toBe(true);
    expect(report.reason).toMatch(/both dimensions/);
  });

  it('flags a mobile preset', () => {
    // `emulate iphone-13`
    const report = detectEmulatedViewport(
      metrics({ innerWidth: 390, innerHeight: 844, devicePixelRatio: 3 })
    );
    expect(report.emulated).toBe(true);
  });

  it('flags a viewport larger than the window', () => {
    const report = detectEmulatedViewport(metrics({ innerWidth: 2400, innerHeight: 1800 }));
    expect(report.emulated).toBe(true);
    expect(report.reason).toMatch(/larger than the window/);
  });

  it('flags an oversized viewport even in one dimension only', () => {
    const report = detectEmulatedViewport(metrics({ innerHeight: 1800 }));
    expect(report.emulated).toBe(true);
    expect(report.reason).toMatch(/larger than the window/);
  });

  it('does not flag DevTools docked to the bottom (height only)', () => {
    expect(detectEmulatedViewport(metrics({ innerHeight: 600 })).emulated).toBe(false);
  });

  it('does not flag DevTools docked to the side (width only)', () => {
    expect(detectEmulatedViewport(metrics({ innerWidth: 600 })).emulated).toBe(false);
  });

  it('does not flag a window with a bookmarks bar and a scrollbar', () => {
    expect(
      detectEmulatedViewport(metrics({ innerWidth: 1116, innerHeight: 1061 })).emulated
    ).toBe(false);
  });

  it('returns not-emulated when metrics are unusable', () => {
    expect(detectEmulatedViewport(metrics({ outerWidth: 0, outerHeight: 0 })).emulated).toBe(false);
    expect(detectEmulatedViewport(metrics({ innerWidth: 0 })).emulated).toBe(false);
  });

  it('says it could not judge, rather than reporting a clean bill of health', () => {
    // A tab that has never been in front reports its window size as 0. Reporting
    // that as "not emulated" is a lie of omission: nothing was checked.
    const report = detectEmulatedViewport(metrics({ outerWidth: 0, outerHeight: 0 }));
    expect(report.conclusive).toBe(false);
    expect(report.inconclusiveReason).toMatch(/outerWidth, outerHeight reported as 0/);
    expect(report.inconclusiveReason).toMatch(/never been in front/);
  });

  it('names whichever metric came back as 0', () => {
    expect(detectEmulatedViewport(metrics({ innerWidth: 0 })).inconclusiveReason).toMatch(
      /^innerWidth reported as 0/
    );
  });

  it('marks a real verdict as conclusive, either way', () => {
    expect(detectEmulatedViewport(metrics({})).conclusive).toBe(true);
    expect(detectEmulatedViewport(metrics({ innerWidth: 390, innerHeight: 844 })).conclusive).toBe(
      true
    );
    expect(detectEmulatedViewport(metrics({})).inconclusiveReason).toBeUndefined();
  });

  it('preserves the raw metrics on the report', () => {
    const report = detectEmulatedViewport(metrics({ innerWidth: 900, innerHeight: 700 }));
    expect(report.innerWidth).toBe(900);
    expect(report.outerWidth).toBe(1147);
    expect(report.devicePixelRatio).toBe(1);
  });
});

describe('parseViewportMetrics', () => {
  it('parses the payload the page evaluates', () => {
    expect(parseViewportMetrics('[900,700,1147,1241,1]')).toEqual({
      innerWidth: 900,
      innerHeight: 700,
      outerWidth: 1147,
      outerHeight: 1241,
      devicePixelRatio: 1,
    });
  });

  it('rejects anything that is not a 5-number array', () => {
    expect(parseViewportMetrics(undefined)).toBeNull();
    expect(parseViewportMetrics(42)).toBeNull();
    expect(parseViewportMetrics('not json')).toBeNull();
    expect(parseViewportMetrics('[1,2,3]')).toBeNull();
    expect(parseViewportMetrics('[1,2,3,4,"x"]')).toBeNull();
    expect(parseViewportMetrics('{"innerWidth":1}')).toBeNull();
  });
});

describe('probeViewport', () => {
  // Its own port: vitest runs test files in parallel and 9240 belongs to cdp.test.ts.
  const testPort = getTestPort('test-dv3');
  let mockServer: MockCDPServer;

  beforeAll(async () => {
    mockServer = new MockCDPServer(testPort);
    await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  beforeEach(() => {
    mockServer.reset();
  });

  it('reports an emulated viewport read out of a tab', async () => {
    mockServer.setHandler('Runtime.evaluate', (params: any) => {
      expect(params.expression).toBe(VIEWPORT_METRICS_EXPRESSION);
      return { result: { type: 'string', value: '[900,700,1147,1241,1]' } };
    });

    const report = await probeViewport(testPort, 'page-1');
    expect(report).not.toBeNull();
    expect(report!.emulated).toBe(true);
    expect(report!.innerWidth).toBe(900);
  });

  it('reports a real viewport as not emulated', async () => {
    mockServer.setHandler('Runtime.evaluate', () => ({
      result: { type: 'string', value: '[1131,1146,1147,1241,1]' },
    }));

    const report = await probeViewport(testPort, 'page-1');
    expect(report!.emulated).toBe(false);
  });

  it('returns null when the tab does not exist', async () => {
    expect(await probeViewport(testPort, 'no-such-tab')).toBeNull();
  });

  it('returns null when the page answers with something unparseable', async () => {
    mockServer.setHandler('Runtime.evaluate', () => ({
      result: { type: 'string', value: 'Evaluated: nonsense' },
    }));

    expect(await probeViewport(testPort, 'page-1')).toBeNull();
  });

  it('returns null instead of hanging when the tab will not answer', async () => {
    mockServer.setHandler('Runtime.evaluate', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { result: { type: 'string', value: '[1,1,1,1,1]' } };
    });

    const started = Date.now();
    expect(await probeViewport(testPort, 'page-1', 150)).toBeNull();
    expect(Date.now() - started).toBeLessThan(900);
  });

  it('returns null when Chrome is not running', async () => {
    expect(await probeViewport(9999, 'page-1')).toBeNull();
  });
});

/**
 * Headless Chrome's default window is 800x600 with the same 16/95 chrome gap as
 * a headed window, which leaves less than 200px of height to play with. These
 * cases were measured live against `--headless` on Chrome 152.
 */
describe('detectEmulatedViewport — headless window', () => {
  const HEADLESS: ViewportMetrics = {
    innerWidth: 784,
    innerHeight: 505,
    outerWidth: 800,
    outerHeight: 600,
    devicePixelRatio: 1,
  };

  it('does not flag the real headless viewport', () => {
    expect(detectEmulatedViewport(HEADLESS).emulated).toBe(false);
  });

  it('flags an oversized override by the physically-impossible rule', () => {
    const report = detectEmulatedViewport({ ...HEADLESS, innerWidth: 2400, innerHeight: 1800 });
    expect(report.emulated).toBe(true);
    expect(report.reason).toBe('viewport is larger than the window');
  });

  it('does not flag a modest override inside a small window — the known blind spot', () => {
    // 780x500 inside an 800x600 window is a real override, but the height gap is
    // only 100px, under the threshold that keeps docked DevTools from crying
    // wolf. Pinned deliberately: absolute thresholds cannot separate these two.
    expect(detectEmulatedViewport({ ...HEADLESS, innerWidth: 780, innerHeight: 500 }).emulated).toBe(false);
    expect(detectEmulatedViewport({ ...HEADLESS, innerWidth: 700, innerHeight: 450 }).emulated).toBe(false);
  });
});

describe('clearHints', () => {
  const report = (emulated: boolean) => ({
    ...REAL_WINDOW,
    innerWidth: emulated ? 2400 : 1131,
    emulated,
    reason: emulated ? 'viewport is larger than the window' : undefined,
  });

  it('suggests the plain undo when the emulated tab is the one dv talks to', () => {
    const tabs = [{ id: 'a', url: 'https://example.com/' }, { id: 'b', url: 'about:blank' }];
    const hints = clearHints('dv2', tabs, [report(true), report(false)]);
    expect(hints.join('\n')).toContain('dv2 resize 0 0');
    expect(hints.join('\n')).not.toContain('--tab');
  });

  it('names the tab when the emulated one is not the default target', () => {
    const tabs = [{ id: 'a', url: 'https://example.com/' }, { id: 'b', url: 'about:blank' }];
    const hints = clearHints('dv2', tabs, [report(false), report(true)]);
    expect(hints.join('\n')).toContain('dv2 resize 0 0 --tab b');
  });

  it('skips DevTools targets when working out the default tab', () => {
    const tabs = [
      { id: 'dt', url: 'devtools://devtools/bundled/inspector.html' },
      { id: 'a', url: 'https://example.com/' },
    ];
    const hints = clearHints('dv2', tabs, [null, report(true)]);
    expect(hints.join('\n')).not.toContain('--tab');
  });

  it('offers --all-tabs and every tab id when more than one is emulated', () => {
    const tabs = [{ id: 'a', url: 'https://example.com/' }, { id: 'b', url: 'about:blank' }];
    const hints = clearHints('dv2', tabs, [report(true), report(true)]);
    const text = hints.join('\n');
    expect(text).toContain('dv2 reset --viewport --all-tabs');
    expect(text).toContain('dv2 resize 0 0 --tab a');
    expect(text).toContain('dv2 resize 0 0 --tab b');
  });

  it('warns that a background tab keeps reporting the old size', () => {
    const tabs = [{ id: 'a', url: 'https://example.com/' }, { id: 'b', url: 'about:blank' }];
    expect(clearHints('dv2', tabs, [report(false), report(true)]).join('\n'))
      .toContain('until it is next in front');
  });
});

describe('sessionScopedNote', () => {
  it('names the override it is talking about', () => {
    expect(sessionScopedNote('user agent')[0]).toContain('The user agent override ends when this command exits');
  });

  it('says why: one connection per command', () => {
    const text = sessionScopedNote('timezone').join(' ');
    expect(text).toContain('dv connects once per command');
  });

  it('exempts the viewport, the one override that does survive', () => {
    const text = sessionScopedNote('network conditions').join(' ');
    expect(text).toContain('Only the viewport');
  });

  it('is gray advisory lines only, with no trailing punctuation surprises', () => {
    const lines = sessionScopedNote('geolocation');
    expect(lines).toHaveLength(3);
    lines.forEach((line) => expect(line.length).toBeLessThan(90));
  });
});
