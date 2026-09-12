# Emulation Reset — fix log

Closes `HANDOFF-EMULATION-RESET.md` (reported from `@woby/wui` editor testing, where a stale
viewport override silently governed three sessions of layout measurements).

**Baseline:** `@missbjs/dv` 1.0.6 at `ffc7a77`.
**Verified against:** Chrome 152.0.7977.83, live headed profile, real window 1147x1241.

---

## 1. `resize 0 0` did nothing — and a bare clear would not have fixed it

**Files:** `src/cdp.ts`, `src/commands/resize.ts`, `src/cli.ts`

**Problem:**
- `resize()` was a bare `Emulation.setDeviceMetricsOverride`; `Emulation.clearDeviceMetricsOverride`
  appeared nowhere in `src/` or `dist/`. `dv resize 0 0` installed a `0x0` override, printed
  `Viewport resized`, and left the previous override governing the tab.
- The override is per-tab and sticky — it survives `location.reload()`, navigation and the CLI
  process exiting — so one stale `resize` quietly governed every later screenshot,
  `elementFromPoint` hit-test and layout measurement, and nothing announced it.

**Second problem, found while verifying the fix:** adding the clear was not enough.
`Emulation.clearDeviceMetricsOverride` reverts only an override installed by the **same** CDP
session, and every dv command is a fresh connect/close. Measured:

```
session A: set 900x700, disconnect      -> tab stays 900x700   (sticky, as reported)
session B: clearDeviceMetricsOverride   -> tab stays 900x700   (clear is a no-op here)
session C: set 640x480, then clear      -> tab back to 1131x1146, and it persists
```

So the clear needs an ownership claim first. `{width: 0, height: 0, deviceScaleFactor: 0}` is
accepted by Chrome as "do not override these", changes nothing on the page, and is enough to
make the following clear effective.

The claim value is not arbitrary. Measured on fresh tabs, planting overrides from 1, 2 and 3
short-lived sessions and then undoing them:

```
stale plants  undo                      restored?
1             bare clear                no  — the stale override survives
1             0x0 claim + clear         yes
1             640x480 claim + clear     yes
2             0x0 claim + clear         yes
2             640x480 claim + clear     no  — the tab is left at 640x480
3             0x0 claim + clear         yes
```

A real-size claim wins against one stale override but strands its own size when several are
stacked; the `0x0` claim held in every case.

**Fix:**
- `src/cdp.ts` — `clearDeviceMetricsOverride()` sends the 0x0 claim, then the clear.
- `src/cdp.ts` — `resize(width, height)` routes to that method when either dimension is falsy,
  matching CDP's own convention that `0` means "no override".
- `src/cli.ts` — `<width>`/`<height>` parse through `parseDimension`, a non-negative-integer
  coercion, so `0` reaches the command instead of being rejected as missing. A bad value gives
  `must be a non-negative integer (0 clears the override)`.
- `src/commands/resize.ts` — the clearing path prints `✓ Viewport override cleared`, not
  `Viewport resized`; the setting path now warns that the override is sticky and prints the undo.

**Code:**
```typescript
async clearDeviceMetricsOverride() {
  await this.send('Emulation.setDeviceMetricsOverride', {
    width: 0, height: 0, deviceScaleFactor: 0, mobile: false,
  });
  await this.send('Emulation.clearDeviceMetricsOverride');
}
```

---

## 2. `reset` — the explicit escape hatch

**Files:** `src/commands/reset.ts` (new), `src/cdp.ts`, `src/cli.ts`

Clears the whole emulation bundle in one call — device metrics, user agent, timezone,
geolocation, network conditions — with `--viewport`, `--user-agent`, `--timezone`,
`--geolocation`, `--network` to narrow it and `--json` / `--yaml` for structured output.
Reports per item, exits non-zero if any clear fails, and never touches window bounds.

CDP exposes a dedicated clear for device metrics and geolocation only, so the rest are cleared
by re-setting them to a neutral value — new `cdp.ts` methods `clearUserAgentOverride`
(empty `userAgent`), `clearTimezoneOverride` (empty `timezoneId`) and `clearNetworkConditions`
(`-1` throughput). All three were confirmed to restore the real value, with no protocol error.

**Measured while verifying:** the viewport is the only override that outlives the command that
set it. `user-agent`, `timezone`, `location` and `throttle` are scoped to their CDP session and
revert the moment that dv process exits — `dv user-agent --ua x` followed by
`dv eval -s navigator.userAgent` already reports the real agent. The bare `reset` says so in its
output, so nobody reads a row of check marks as having undone something that was still in effect.

---

## 3. `status` reports an emulated viewport

**Files:** `src/emulation.ts` (new), `src/commands/status.ts`

There is no CDP getter for "is an override active", and none is needed: an override changes
`innerWidth/innerHeight` and leaves the real window alone, so the mismatch is the signal.
`status` evaluates `[innerWidth, innerHeight, outerWidth, outerHeight, devicePixelRatio]` in
every content tab (in parallel, short-lived connections, `devtools://` tabs skipped) and prints:

```
  ○ 1. Example Domain
     URL: https://example.com/
     Viewport: 900x700  ⚠ emulated — window is 1147x1241
```

**Thresholds are measured, not guessed.** On the baseline window `outer − inner` was 16px wide
and 95px tall; a `900x700` override made it 247/541. `detectEmulatedViewport` flags a tab only
when the gap exceeds 40px **and** 200px — both dimensions — or when the viewport is physically
larger than its window (an oversized override, e.g. `2400x1800`). Requiring both dimensions is
what keeps docked DevTools, which shrinks one edge only, from reading as emulation. The accepted
trade-off: an override that matches the real window closely in one dimension goes unflagged.

`--json` / `--yaml` gain a top-level `emulatedTabs` count and `tabs[].viewport` with `width`,
`height`, `windowWidth`, `windowHeight`, `devicePixelRatio`, `emulated`, `emulationReason`.
`--no-viewport` skips the probe. `status` reports and never mutates.

---

## 4. `start` clears device metrics on session creation

**File:** `src/commands/start.ts`

One clear after `ensureChromeRunning` — and only there. A brand-new session carrying an override
is never intentional. The already-running early-return path deliberately does **not** clear, so
`dv start` against a live profile leaves a deliberate `emulate iphone-13` alone.

---

## 5. The undo had to be able to name a tab

**Files:** `src/commands/resize.ts`, `src/commands/reset.ts`, `src/commands/status.ts`, `src/cli.ts`

Found while verifying fix 3 against two tabs. Overrides are per-target, but `resize` and `reset`
connect the way every other dv command does — to the first content tab — so an override on any
other tab was reported by `status` and clearable by nothing:

```
emulatedTabs: 1
 - about:blank            784x505    emulated=false
 - https://example.com/  2400x1800   emulated=true     <- reported, unreachable
dv2 resize 0 0   ->  clears about:blank; example.com stays overridden
```

`status` pointing at a command that cannot fix what it found is the same class of bug as the
original one, so:

- `resize` and `reset` take `--tab <id>` (dv's existing option name, with the usual `--tab-id`
  alias), and `reset` takes `--all-tabs` to walk every content tab, reporting per tab and
  exiting non-zero if any clear fails.
- `status` aims its hint at the tabs that are actually emulated: the plain `resize 0 0` when the
  flagged tab is the default target, `resize 0 0 --tab <id>` when it is not, and
  `reset --viewport --all-tabs` plus the individual ids when several are flagged.

**One measurement trap, documented rather than fixed:** a tab that is not in front keeps
reporting the inner size its widget last settled at. A cleared background tab therefore still
reads as emulated — `Page.bringToFront` then shows the real size and confirms the override was
gone all along. `status` will not bring tabs to front to get a cleaner number (that steals focus,
and `status` does not change state), so it says so instead, as does `resize 0 0 --tab`.

---

## 6. `--tab` on 64 commands, and an unknown id that fails loudly

**Files:** `src/tab.ts` (new), `src/cdp.ts`, `src/cli.ts`, 58 files in `src/commands/`

Section 5 gave the *undo* a `--tab`, which left the hazard it was working around in place:
every other command still ran against whichever tab came first in `/json/list`. That order is
activation order, so clicking a tab moves the target:

```
dv2 tabs
  1. https://example.com/        01C03832...   <- just activated, so now first
  2. https://www.microsoft.com/  6CF0E9E6...
dv2 eval --script "location.host"   ->  example.com      (not the tab under test)
```

`CDPClient.connect(tabId?)` already accepted a tab, so this was plumbing, not protocol work:

- `src/tab.ts` holds the shared `TabOptions` interface and `targetTab(options)`, which folds
  `--tab` and the legacy `--tab-id` into one value. It uses `||`, not `??`, so `--tab ""`
  falls back to the default tab instead of failing a lookup for the empty id.
- Two shared `Option` instances in `src/cli.ts` (`--tab <id>`, `--tab-id <id>`) are added to
  60 command definitions. Sharing one `Option` across commands is safe in Commander 15 —
  values live on the `Command`, not the `Option` — as the pre-existing `profileOption` shows.
- Left off the 10 commands where it would be a lie: `start`, `stop`, `status`, `tabs`, `new`,
  `close`, `profiles`, `clear-cache`, `cookies-clear`, `batch`. `select` keeps its own
  `--tab`, which means "the tab to activate".

**`connect()` no longer falls back.** An id that matched nothing dropped to the default tab, so
a typo ran the command on the wrong page and reported success:

```
dv2 eval --tab NOPE123 --script "location.host"
Error: No tab with ID NOPE123 on port 9231. List open tabs with: dv2 tabs
```

**One command needed more than plumbing.** `storage-clear` derives an origin from a tab, and
it was deriving it from the *default* tab while connecting to the named one — so
`storage-clear --tab <microsoft> --type local` would have cleared example.com's storage. It now
takes the origin from the tab it actually connected to. Verified live: microsoft.com's
`localStorage` was cleared and example.com's `dvprobe=ex` was left intact.

---

## 7. What a session-scoped override actually costs

**Files:** `src/emulation.ts`, `src/commands/emulate.ts`, `user-agent.ts`, `timezone.ts`,
`location.ts`, `throttle.ts`, `src/cdp.ts`, `src/cli.ts`

Fix 1 established that the viewport survives a dv command exiting. Measured what else does, by
setting an override and reading it back from a *later* command (Chrome 152, live profile):

| Override | Set by | After the command exits |
|---|---|---|
| Viewport width/height | `resize`, `emulate` | **persists** — widget keeps its size, CSS/media queries follow |
| `devicePixelRatio` | `emulate` | reverts (in-session `3` -> `1`) |
| `screen.width`/`height` | `emulate` | reverts (in-session `390` -> `2880`) |
| Mobile flag | `emulate` | reverts |
| User agent | `emulate`, `user-agent` | reverts (read back as desktop Chrome 152) |
| Timezone | `timezone` | reverts (set `Asia/Tokyo`, read back `Asia/Singapore`) |
| Geolocation, throttling | `location`, `throttle` | revert |

Four commands printed `✓ ... override set` with nothing to suggest any of this, and `emulate`
listed all five of its settings as one block — reading as a promise that the next command
breaks. Two changes:

- `sessionScopedNote(what)` in `src/emulation.ts` returns the three advisory lines now printed
  by `user-agent`, `timezone`, `location` and `throttle`. None of the four uses structured
  output, so gray lines cannot pollute a `--json` consumer.
- `emulate` splits its output by lifetime — "Outlives this command" (width, height, and the
  note that CSS and media queries stay mobile) versus "Reverts the moment this command exits"
  (device scale factor, mobile flag, user agent) — and prints the exact
  `reset --viewport [--tab <id>]` undo.

**The gap this exposed, and the fix.** A site that branches on the user agent could not be
tested as a phone at all: the UA has to be in effect when the *request* goes out, and every dv
command is a new connection. `batch` does not help — it spawns one CLI process per step. So
`emulate` gained `--navigate <url>` and `--reload`, which load the page inside the same
session that installed the metrics and UA and wait for `Page.loadEventFired` before
disconnecting (new `CDPClient.navigateAndWait(url, waitMs)`).

Verified against a local echo server that returns the request's `User-Agent`:

```
navigate http://127.0.0.1:8799/                      -> server saw: Mozilla/5.0 (Windows NT 10.0...
emulate -d iphone-13 --navigate http://127.0.0.1:8799/
  read back after the command exited:
    server saw:            Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS...
    navigator.userAgent:   Mozilla/5.0 (Windows NT 10...     <- already reverted
    innerWidth:            390                               <- persisted
emulate -d pixel-5 --reload                          -> server saw: Mozilla/5.0 (Linux; Android 14; Pixel 5)...
```

The mobile *response* is on the page; the mobile *identity* is gone. Both facts are now in the
command's own output.

---

## 8. `status` could not tell "clean" from "unmeasurable"

**Files:** `src/emulation.ts`, `src/commands/status.ts`

Detection compares `innerWidth/Height` against `outerWidth/Height`. When the outer values come
back as `0` — which is what a tab that has never been in front reports — the comparison is
meaningless, and the old code returned `emulated: false`: the same answer as a verified-clean
tab. A `chrome://` page, which cannot be probed at all, also read as clean.

`ViewportReport` gained `conclusive` and `inconclusiveReason`, and `status` reports three
states instead of two:

```
     Viewport: 390x844  ⚠ cannot tell — outerWidth, outerHeight reported as 0 — a tab that
                          has never been in front has no window size to compare against
     Viewport: not readable (tab did not answer)
⚠ 2 tab(s) could not be checked for an emulated viewport.
```

`--json`/`--yaml` carry top-level `inconclusiveTabs` and `unprobedTabs` counts plus per-tab
`viewport.conclusive` and `viewport.inconclusiveReason`, so `emulatedTabs: 0` beside
`inconclusiveTabs: 2` no longer reads as two clean tabs. `status` still only reports.

---

## Deliberately not done

Per the handoff: no clearing on connect, on `navigate`, on `reload` or on `screenshot` —
emulation you cannot trust to persist is a worse bug than the one being fixed. `status` reports
a mismatch and never auto-fixes it. `Browser.setWindowBounds` is not used as the undo; window
bounds were `{left: 566, top: 57, width: 1147, height: 1241}` before and after the whole
acceptance run.

---

## Acceptance check (live, profile dv2 / port 9231)

| Step | Result |
|---|---|
| 1. `eval "[innerWidth,innerHeight]"` | `[1131,1146]` — true size |
| 2. `resize 900 700` then `eval` | `[900,700]` |
| 3. `status` | `Viewport: 900x700  ⚠ emulated — window is 1147x1241` plus summary and undo hint |
| 4. `navigate` then `eval`; `reload` then `eval` | `[900,700]` both times — persistence intended |
| 5. `resize 0 0` then `eval` | `[1131,1146]`; `status` reports `Viewport: 1131x1146`, no warning |
| 6. `resize 900 700` then `reset` | `[1131,1146]`, real UA, `Asia/Singapore`; `reset --viewport` also verified |
| 7. `Browser.getWindowForTarget` before/after | identical bounds — `{left: 566, top: 57, width: 1147, height: 1241}` |
| extra | `emulate -d iphone-13` flagged at `390x844`; `start` on a live profile does not clear; `stop` plus a fresh `start` comes up unemulated |
| headless | `start --headless`: real `[784,505]` in an 800x600 window, `resize 900 700` flagged by the oversize rule, `resize 0 0` restores `[784,505]` |
| multi-tab | two tabs, one override: `status` flags exactly that tab and `emulatedTabs: 1`; overrides on both, `reset --viewport --all-tabs` restores both (measured with each tab brought to front) |
| per-tab undo | override planted on a background tab from a dead session: `status` names it, `resize 0 0 --tab <id>` clears it |

All seven steps were re-run after the `--tab` / `--all-tabs` work, headed, with the same result
and the same window bounds.

## Tests

`npm test` — 10 files, 362 tests, all passing (`test/cdp.test.ts` 130, `test/cli.test.ts` 43,
`test/emulation.test.ts` 33, `test/tab.test.ts` 5).

- `test/emulation.test.ts` (new, 26): `detectEmulatedViewport` against the measured baselines
  (real window, `900x700` override, mobile preset, oversized viewport, DevTools docked either
  way, bookmarks-bar-plus-scrollbar window, unusable metrics), `parseViewportMetrics` rejection
  cases, and `probeViewport` over the mock CDP server including its timeout and missing-tab paths.
  Plus the headless baselines measured live (800x600 window: real `784x505` unflagged, `2400x1800`
  flagged, `780x500` and `700x450` deliberately *not* flagged — see the limits below) and
  `clearHints`, which decides whether the undo needs to name a tab.
- `test/cdp.test.ts` (+8): `resize(1280, 720)` still sends a plain override; `resize(0, 0)` and
  `resize(900, 0)` send the 0x0 claim and the clear and never a real size; the claim is asserted
  to come *before* the clear; the three neutral-value clears.
- `test/cli.test.ts` (+10): `resize --help` documents clearing, `resize 0 0` survives argument
  parsing, `resize abc 100` and `resize -5 100` are rejected, `reset` is registered and lists its
  flags and requires a profile, both take `--tab` and `reset` takes `--all-tabs`, and
  `status --help` offers `--no-viewport`.
- `test/mock-cdp-server.ts`: added an `Emulation.clearDeviceMetricsOverride` handler, and
  `Page.navigate` now fires a delayed `Page.loadEventFired` (as `Page.reload` already did) so
  `navigateAndWait()` resolves.
- `test/tab.test.ts` (new, 5): `targetTab` prefers `--tab`, accepts `--tab-id`, and maps an
  empty value to `undefined` so `--tab ""` falls back to the default tab rather than failing a
  lookup for the empty id.
- `test/cdp.test.ts` (+5 beyond the 8 above): an unknown tab id throws naming the id and the
  port, the message ends in the profile's `tabs` command, the client is left unconnected rather
  than falling back to the default tab, and `navigateAndWait` sends the URL and enables `Page`
  first.
- `test/emulation.test.ts` (+7): the zero-metrics guard returns `conclusive: false` with a
  reason naming whichever metric was `0`, a usable probe is `conclusive` either way, and
  `sessionScopedNote` names its override and exempts the viewport.
- `test/cli.test.ts` (+5): 12 per-tab commands offer `--tab <id>`, 7 browser-level commands do
  not, `--tab-id` still appears alongside `--tab`, `emulate` offers `--navigate`/`--reload`,
  and `eval --tab NOPE` reports the id it could not find.

## Known limits

Stated plainly, because a detector that looks authoritative is worse than one whose edges are
written down.

- **Absolute thresholds miss small overrides.** Flagging needs a gap past 40px wide *and* 200px
  tall, so an override within that of the real window is not reported. It matters most in small
  windows: in headless Chrome's default 800x600, `780x500` and `700x450` are real overrides that
  go unflagged (pinned in the tests so the behaviour is deliberate rather than accidental). The
  alternative — a tighter threshold — starts flagging docked DevTools and bookmarks bars.
- **Background tabs report stale sizes.** Covered in section 5: a cleared tab can still read as
  emulated until it is next in front. The override really is gone.
- **Thresholds are Windows numbers.** The 16px/95px chrome baseline was measured on Windows 11,
  Chrome 152. macOS and Linux chrome differ; the oversize rule is platform-independent, the
  both-dimensions rule is not.
- **Browser zoom is untested.** The handoff's 110%-zoom case (a `900x700` override reading as
  `818x636`) was not reproduced here.
- **`start`'s clear is verified as a code path, not an effect.** A brand-new Chrome has no
  override to clear, so there is nothing observable to assert beyond "it runs and does not error,
  and the already-running path does not clear".
- **Non-viewport clears are verified as protocol calls.** User agent, timezone, geolocation and
  throttling die with the CDP session that set them, so after `reset` they are already gone —
  `reset` clears them and says as much rather than implying it undid something still in effect.
- **`emulate --navigate` is one load, not a session.** It gets the device user agent onto the
  wire for that navigation; anything the page fetches *later* (XHR after the load event, a
  lazy-loaded route) goes out with the real user agent again. There is no way around that
  without a long-lived dv session.
- **The advisory lines are not asserted at the CLI level.** `sessionScopedNote` is unit-tested
  and the five commands' output was read by hand against real Chrome; no test spawns
  `user-agent` and greps its stdout.
- **No unit tests for the command bodies.** `reset.ts`, `resize.ts` and `status.ts` are covered by
  their pure helpers, the CLI-level tests and the live acceptance run; the human and `--json`
  output shapes were checked by hand against real Chrome, not asserted in a test.

## Files Modified

- `src/cdp.ts` — `resize` self-clears on `0`; added `clearDeviceMetricsOverride` (claim-then-clear),
  `clearUserAgentOverride`, `clearTimezoneOverride`, `clearNetworkConditions`
- `src/emulation.ts` — NEW: viewport detection and probe
- `src/commands/reset.ts` — NEW: the `reset` command
- `src/commands/resize.ts` — clearing path and stickiness warning
- `src/commands/status.ts` — per-tab viewport reporting, human and structured
- `src/commands/start.ts` — clear on session creation only
- `src/cli.ts` — `parseDimension`, `reset` registration, `status --no-viewport`, shared
  `--tab`/`--tab-id` options on 60 commands, `reset --all-tabs`, `emulate --navigate/--reload`
- `src/tab.ts` — NEW: `TabOptions`, `targetTab`
- `src/cdp.ts` — also: `connect()` throws on an unknown tab id; added `navigateAndWait`
- `src/emulation.ts` — also: `conclusive`/`inconclusiveReason`, `sessionScopedNote`
- `src/commands/emulate.ts` — lifetime-split output, `--navigate`/`--reload`
- `src/commands/user-agent.ts`, `timezone.ts`, `location.ts`, `throttle.ts` — session-scope note
- `src/commands/storage-clear.ts` — origin comes from the named tab
- 54 further files in `src/commands/` — `TabOptions` + `connect(targetTab(options))`
- `test/emulation.test.ts`, `test/tab.test.ts` — NEW
- `test/cdp.test.ts`, `test/cli.test.ts`, `test/mock-cdp-server.ts`
- `README.md`, `QUICK-REFERENCE.md`, `EXAMPLES.md`, `CDP-COVERAGE.md`, `CHANGELOG.md`

**Total:** 5 files created, 70 modified.
