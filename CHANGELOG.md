# Changelog

## @missbjs/dv

### Unreleased

#### Fixed
- **`resize 0 0` now actually clears the viewport override.** It previously printed
  `Viewport resized` and did nothing: `Emulation.clearDeviceMetricsOverride` was never called
  anywhere in the codebase. A device-metrics override is per-tab and sticky — it survives
  reloads, navigation and the CLI process exiting — so one stale `resize` silently governed
  every later screenshot, `elementFromPoint` hit-test and layout measurement, with nothing
  announcing it.
- **Clearing device metrics now claims ownership first.** `Emulation.clearDeviceMetricsOverride`
  only reverts an override installed by the *same* CDP session, and every dv command is a fresh
  connect/close, so a bare clear left the stale override in place. `clearDeviceMetricsOverride()`
  now sends a no-op `setDeviceMetricsOverride {width: 0, height: 0, deviceScaleFactor: 0}` —
  nothing on the page moves — immediately before the clear (verified against Chrome 152).

#### Added
- **`reset`** — clear the emulation bundle in one call: viewport (device metrics), user agent,
  timezone, geolocation and network conditions. Narrow it with `--viewport`, `--user-agent`,
  `--timezone`, `--geolocation`, `--network`; supports `--json` / `--yaml`. Exits non-zero if any
  clear fails. Never touches the real window bounds.
- **`status` reports the per-tab viewport** and warns when it looks emulated:
  `Viewport: 900x700  ⚠ emulated — window is 1147x1241`. There is no CDP getter for "is an
  override active", so this compares `innerWidth/innerHeight` against `outerWidth/outerHeight`
  per tab; it only flags a mismatch past browser chrome in *both* dimensions (so DevTools docked
  to one edge is not a false positive) or a viewport physically larger than its window.
  `--json` / `--yaml` gain a top-level `emulatedTabs` count and `tabs[].viewport`
  (`width`, `height`, `windowWidth`, `windowHeight`, `devicePixelRatio`, `emulated`,
  `emulationReason`). `--no-viewport` skips the probe. `status` never changes emulation state —
  including never bringing a tab to front to measure it, which means a background tab can keep
  reporting its old inner size for a while after its override is genuinely gone.
- **`start` clears device metrics when it creates a session** — a brand-new Chrome carrying an
  override is never intentional. Only on that path: dv never clears on connect, on `navigate`,
  on `reload` or on `screenshot`, so a deliberate `emulate iphone-13` still persists.
- **`--tab <id>` on `resize` and `reset`, plus `reset --all-tabs`.** Overrides are per-target,
  and both commands otherwise talk to the same tab as the rest of dv (the first content tab) —
  so an override on any other tab was reported by `status` and reachable by nothing. `status`
  now names the tab in its hint when the emulated tab is not the default target, and offers
  `reset --viewport --all-tabs` when several tabs are affected.
- `resize` now warns that the override is sticky and prints the undo command.
- **`--tab <id>` on every command that drives a page — 64 of them.** Previously only
  `console`, `select`, `close`, `resize` and `reset` could name a tab; everything else
  ran against whatever tab came first in `/json/list`. That order is *activation* order, so
  on a profile with more than one tab open the target shifted as tabs were clicked and a
  script had no way to pin it. `--tab-id` is kept as a deprecated alias. Not added to the
  10 commands where it would be a lie: `start`, `stop`, `status`, `tabs`, `new`, `close`,
  `profiles`, `clear-cache`, `cookies-clear`, `batch`.
- **An unknown `--tab` id is now an error, not a silent fallback.** `connect()` used to
  drop to the default tab when the id matched nothing, so a typo ran the command somewhere
  else and reported success. It now fails with
  `No tab with ID NOPE123 on port 9231. List open tabs with: dv2 tabs`.
- **`emulate --navigate <url>` and `emulate --reload`** — load the page from inside the
  same CDP session that installed the device metrics and user agent, then wait for the load
  event before disconnecting. This is the only way to make a UA-branching site serve its
  mobile response: every dv command is its own connection, so by the next command the user
  agent override is gone. `batch` is not a substitute — it spawns one process per step.
  New `CDPClient.navigateAndWait(url, waitMs)` backs it.
- **`status` now distinguishes "not emulated" from "could not tell".** A tab that has
  never been in front reports `outerWidth`/`outerHeight` as 0, and a `chrome://` page
  cannot be probed at all — both previously read as a clean tab. Human output gains
  `⚠ cannot tell — <reason>` and `not readable (tab did not answer)`, plus a footer
  counting the unchecked tabs; `--json`/`--yaml` gain top-level `inconclusiveTabs` and
  `unprobedTabs` counts and per-tab `viewport.conclusive` /
  `viewport.inconclusiveReason`. So `emulatedTabs: 0` alongside `inconclusiveTabs: 2`
  no longer reads as two clean tabs.
- **Commands that install a session-scoped override now say that they do.**
  `user-agent`, `timezone`, `location` and `throttle` printed `✓ … override set` with
  nothing to suggest the override was gone before the next command ran (measured: after
  `timezone --tz Asia/Tokyo`, the next command read `Asia/Singapore`). They now print the
  shared `sessionScopedNote()` lines. `emulate` splits its output by lifetime instead of
  listing all five settings as one block — width/height (and the CSS/media queries that
  follow) under "Outlives this command", device scale factor, mobile flag and user agent
  under "Reverts the moment this command exits" — and prints the exact undo command.

- **13 new commands** for richer browser automation:
  - **`dblclick`** — double-click an element (via `Input.dispatchMouseEvent` with `clickCount: 2`)
  - **`check` / `uncheck`** — toggle checkboxes and radio buttons via `el.checked = true/false`
  - **`scroll-into-view`** — scroll an element into the viewport (via `DOM.scrollIntoViewIfNeeded`)
  - **`clipboard`** — read, write, copy, and paste clipboard content (via `Clipboard.readText`/`writeText` + `execCommand`)
  - **`pdf`** — export the current page as PDF (via `Page.printToPDF`), with options for paper size, margins, landscape, print-background, and page ranges
  - **`is-visible` / `is-enabled` / `is-checked`** — query element state via `el.checkVisibility()`, `el.disabled`, `el.checked`
  - **`value` / `attr` / `box` / `style`** — read input value, attribute, box model (x/y/width/height/center), and computed CSS styles
- All new state query commands support `--json` / `--yaml` structured output and `>>>` shadow-piercing selectors.

#### Changed
- `resize`'s `<width>`/`<height>` are parsed as non-negative integers, so `0` reaches the
  command instead of being rejected, and a bad value gives
  `must be a non-negative integer (0 clears the override)`.
- New `src/emulation.ts`: `detectEmulatedViewport`, `parseViewportMetrics`, `probeViewport`.
- New `cdp.ts` methods: `clearDeviceMetricsOverride`, `clearUserAgentOverride`,
  `clearTimezoneOverride`, `clearNetworkConditions`.
- **`get-box` → `box`, `get-styles` → `style`, `get-value` → `value`, `get-attr` → `attr`** — the four `get-*` state query commands are now primary under their short names. The `get-*` forms are still accepted as backward-compatible aliases.
- **`--tab-id` → `--tab`** — the deprecated `--tab-id` option is replaced by `--tab` across `console`, `select`, and `close` commands. `--tab-id` is still accepted as a backward-compatible alias.
- **`--computed-style` → `--style`** on the `query` command. `--computed-style` is still accepted as a deprecated alias.
- Updated CDP coverage: 13 domains (23.2%), up from 11 (19.6%).

#### Docs
- README.md, QUICK-REFERENCE.md, EXAMPLES.md: per-tab targeting with `--tab`, the unknown-tab
  error, the `status` inconclusive/unprobed distinction, and a lifetime table for `emulate`
  showing what survives the command (viewport and its media queries) versus what reverts
  (device pixel ratio, `screen.*`, mobile flag, user agent) — with `--navigate`/`--reload`
  as the way to get a mobile response out of the server.
- README.md: the supported-device list said "iPhone 13 Pro", which `emulate` has never
  accepted; it now lists the six real device keys.
- README.md, QUICK-REFERENCE.md, EXAMPLES.md: how to take emulation back off, and the fact that
  the viewport is the only override that outlives the command that set it — `user-agent`,
  `timezone`, `location` and `throttle` are scoped to their own CDP session and end with it.
- CDP-COVERAGE.md: Emulation clear-side coverage, the session-ownership caveat, command count 73 → 74.
- Updated README.md: command count 59→73, added sections for Element State & Box Model (7 commands) and Clipboard & PDF (2 commands), expanded Element Interaction (9→13), updated `--computed-style` → `--style` throughout, added `--tab` to relevant commands, added Clipboard domain to CDP coverage.
- Updated QUICK-REFERENCE.md: total command count 59→73, new sections for Element State & Box Model and Clipboard & PDF, updated `--computed-style` → `--style`, updated `--tab-id` → `--tab`.
- Updated CDP-COVERAGE.md: added 2 new domains, 4 new command groups, updated coverage to 23.2%.
- Updated EXAMPLES.md: `dv1 close <id>` → `dv1 close <tab>` in Step 10.

### 1.0.0 (2026-07-03)

#### Profile System Refactor
Replaced `--port` parameter with profile-specific commands (`dv1`–`dv6`).

**Changes:**
- Each profile has its own command: `dv1` through `dv6` (instead of `dv start --port 9222`)
- Profiles renamed from `profile-qmdj-1` to `dv1` through `dv6`
- Port assignments changed: 9230-9235 (instead of 9222-9227)
- `dv profiles` command lists all available profiles
- `dv` base command is internal (use `dv1`–`dv6` wrappers)

**Profile Table:**
| Profile | Port |
|---------|------|
| dv1 | 9230 |
| dv2 | 9231 |
| dv3 | 9232 |
| dv4 | 9233 |
| dv5 | 9234 |
| dv6 | 9235 |

**Example:**
```bash
# Old (deprecated)
dv start --port 9222
dv navigate --port 9222 --url https://example.com

# New (current)
dv1 start
dv1 goto https://example.com
```

---

### 0.9.0 (2026-06-22)

#### Feature Expansion
Added 32 new commands across Network, DOM, Emulation, and Storage domains.

**New Commands:**

Network (4):
- `network` - List/monitor network requests
- `intercept` - Block/mock network requests
- `request` - Get request/response details
- `clear-cache` - Clear browser cache

DOM (7):
- `inspect` - Inspect element details
- `query-all` - Query all matching elements
- `get-text` - Get element text content
- `get-html` - Get element HTML
- `set-text` - Set element text content
- `set-html` - Set element HTML
- `set-attribute` - Set element attribute

Emulation (5):
- `emulate` - Device emulation (iPhone, Pixel, iPad)
- `location` - Geolocation override
- `user-agent` - User agent override
- `timezone` - Timezone override
- `throttle` - Network throttling (offline, 3G)

Storage (5):
- `cookies` - List cookies
- `cookies-clear` - Clear cookies
- `storage-clear` - Clear localStorage/sessionStorage
- `local-storage` - List localStorage items
- `session-storage` - List sessionStorage items

**CDP Coverage:** Increased from 12.5% (7 domains) to 19.6% (11 domains)

---

### 0.2.0 (2026-06-16)

#### Mandatory Port Parameter
Made `--port` parameter mandatory for all CDP commands to prevent AI agent collisions.

**Problem:**
- AI agents used default port 9222 when port was optional
- Multiple agents could accidentally interfere with each other's browser instances

**Solution:**
- Made `--port` required for all commands connecting to Chrome
- Forces explicit port specification

**Commands Updated (15):**
navigate, eval, snapshot, screenshot, console, click, fill, type, key, pages, select, new, close, resize, monitor

---

### 0.1.0 (2026-06-15)

#### Initial Release
Core browser automation commands.

**Commands (17):**
- `start` - Start Chrome with remote debugging
- `status` - Check Chrome status
- `navigate` - Navigate to URL
- `eval` - Evaluate JavaScript
- `snapshot` - Accessibility snapshot
- `screenshot` - Take screenshot
- `console` - List console messages
- `click` - Click element
- `fill` - Fill input
- `type` - Type text
- `key` - Press key
- `tabs` - List tabs
- `select` - Select tab
- `new` - Open new tab
- `close` - Close tab
- `resize` - Resize viewport
- `monitor` - Real-time console monitoring

**Architecture:**
- TypeScript 5.5
- Node.js ≥18.0.0
- Chrome DevTools Protocol via WebSocket
- Dependencies: ws, axios, commander, chalk