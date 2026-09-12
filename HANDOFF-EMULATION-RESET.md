# Handoff — dv can set emulation state but cannot unset it

**Repo:** `@missbjs/dv` (this one), version 1.0.6 at `ffc7a77`.
**Reported from:** `@woby/wui` editor testing, where a stale viewport override silently governed
three separate sessions of layout measurements.
**Status:** diagnosed, reproduced, not fixed. Nothing in this repo has been modified.

---

## The bug in one line

`dv resize 0 0` prints `Viewport resized` and does nothing, and there is no other way — in any
command — to take a device-metrics override back off.

## Why it matters

An override is **per-target and sticky**. It survives `location.reload()`, tab navigation, and
the CLI process exiting (every dv command is a fresh connect/close). So one `dv4 resize 900 800`
typed early in a session quietly governs every screenshot, every click hit-test and every layout
measurement for the rest of that session — and for the next one, because the browser stays open.

Worse, nothing ever *says* so. The failure looks like a page bug:

- screenshots crop at the emulated height, so anything below is "missing"
- `elementFromPoint` returns `null` for elements below a fold that does not really exist
- clicks land nowhere, because the point was computed against a viewport the renderer disagrees with

It is also easy to misread the number. On a window at 110% browser zoom a `900x800` override
reads as `innerWidth` **818** — so the size in the CLI history and the size in the page never
match, and it does not look like an override at all.

## Reproduction (verified on a live tab, raw CDP)

```
innerWidth/Height                                    1622 x 1254
-> Emulation.setDeviceMetricsOverride {900,700,1,false}
innerWidth/Height                                     818 x 636      (900/1.1, 700/1.1)
-> Emulation.clearDeviceMetricsOverride {}
innerWidth/Height                                    1622 x 1254     window bounds never touched
```

So the CDP-level undo works perfectly and instantly. dv just never calls it.

## Evidence in this repo

| What | Where |
|---|---|
| `resize` is a bare `setDeviceMetricsOverride`, no 0-handling | `src/cdp.ts:404-411` |
| the other setter, used by `emulate` | `src/cdp.ts:546-553` |
| `emulate` calls it with a device preset | `src/commands/emulate.ts:34` |
| `resize` command — prints success unconditionally | `src/commands/resize.ts:17-20` |
| CLI registration, `<width> <height>` both required ints | `src/cli.ts:286-293` |
| `Emulation.clearDeviceMetricsOverride` | **appears nowhere in `src/` or `dist/`, in 1.0.4 or 1.0.6** |

The same shape covers the rest of the Emulation domain — dv has five commands that *set* state
and none that clear it:

| Command | Sets | Clearer in `cdp.ts` | Exposed by a command |
|---|---|---|---|
| `resize` | `setDeviceMetricsOverride` | — | no |
| `emulate` | `setDeviceMetricsOverride` | — | no |
| `user-agent` | `setUserAgentOverride` (`cdp.ts:559`) | — | no |
| `timezone` | `setTimezoneOverride` (`cdp.ts:563`) | — | no |
| `throttle` | `Network.emulateNetworkConditions` (`cdp.ts:567`) | — | no |
| `location` | `setGeolocationOverride` (`cdp.ts:555`) | `clearGeolocationOverride` (`cdp.ts:576`) | **no — method exists, orphaned** |

`clearGeolocationOverride` being present but unreachable is the tell: the clearing half of this
domain was started and never wired up.

---

## Proposed fixes, in priority order

### 1. `resize 0 0` must actually clear — smallest, highest value

CDP's own convention is that `0` means "do not override this dimension", so `0 0` already reads
as "clear" to anyone who knows the protocol, and dv already *claims* to have done it.

- `src/cdp.ts` — add `async clearDeviceMetricsOverride() { await this.send('Emulation.clearDeviceMetricsOverride') }`
- `src/cdp.ts:404` `resize(width, height)` — if either is falsy, call the clear instead
- `src/cli.ts:286` — `width`/`height` are `.argument('<width>', …, parseInt)`; make sure `0` survives
  argument parsing rather than being rejected as missing
- `src/commands/resize.ts` — print `Viewport override cleared` for that path, not `Viewport resized`

### 2. `dv reset` — the explicit escape hatch

A new command that clears the whole emulation bundle in one call: device metrics, user agent,
timezone, geolocation, network conditions. Flags to narrow it (`--viewport`, `--network`, …) are
nice but the bare form is what someone reaches for when a session has gone strange.

This is the item that actually closes the gap. `resize 0 0` only fixes the one override that
happens to bite most often.

### 3. `dv status` should report an emulated viewport

This is why the bug cost three sessions: nothing ever announced it. There is no CDP getter for
"is an override active", but none is needed — the mismatch is the signal. `status`
(`src/commands/status.ts`) already walks every tab; evaluate
`[innerWidth, innerHeight, outerWidth, outerHeight, devicePixelRatio]` per tab and print:

```
  ○ 1. wui editor demo
     URL: http://localhost:5173/demo-editor.html
     Viewport: 818x636  ⚠ emulated — window is 1622x1254
```

Only warn when the numbers disagree beyond browser chrome and `devicePixelRatio`. Include it in
the `--json` shape too, since agents read that path.

### 4. `dv start` clears device metrics on session creation

Safe **there and only there**: a brand-new Chrome carrying an override from a previous session is
never intentional. `src/commands/start.ts:13` already builds a `CDPClient`; one clear after
connect. Cheap insurance against leakage across sessions.

---

## Do NOT do these

- **Do not clear on connect.** Every dv command is a fresh connect/close, so this would silently
  undo a deliberate `dv emulate iphone-13` between any two commands. Emulation you cannot trust
  to persist is a worse bug than the one being fixed.
- **Do not clear on `navigate`, `reload` or `screenshot`.** Same reasoning: testing a mobile
  layout across a navigation is a normal thing to want.
- **Do not "auto-fix" a detected mismatch in `status`.** A status command that changes state is a
  trap. Report it; let the human or agent decide.
- **Do not reach for `Browser.setWindowBounds` as the undo.** A width−1-and-back nudge does force
  the re-layout and does restore the size, but it is a side effect, not the undo — and it moves
  the user's real window, which during a test run is not dv's to touch.

## Acceptance check

Run against a live profile with a real window:

1. `dv4 eval "[innerWidth,innerHeight]"` → note the true size, e.g. `[1622,1254]`
2. `dv4 resize 900 700` → `dv4 eval` shows the emulated size (divided by browser zoom)
3. `dv4 status` → warns that the viewport is emulated, and prints both numbers
4. `dv4 navigate <url>` then `dv4 eval` → **still emulated** (persistence is intended)
5. `dv4 resize 0 0` → `dv4 eval` back to `[1622,1254]`; `dv4 status` no longer warns
6. `dv4 resize 900 700` again, then `dv4 reset` → back to `[1622,1254]`, and `user-agent`,
   `timezone`, `throttle` are all back to their real values too
7. window bounds unchanged throughout — compare `Browser.getWindowForTarget` before and after

## Related

- `PRODUCTION_FIXES.md`, `REVIEW.md` — existing fix-log conventions in this repo
- `CDP-COVERAGE.md` — the Emulation domain's clear-side methods are the coverage gap this closes
