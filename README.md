# @missbjs/dv

**Chrome DevTools Protocol CLI** - A comprehensive TypeScript CLI tool for browser automation, testing, and debugging.

## Installation

```bash
npm install -g @missbjs/dv
```

Or download the standalone Windows binary (no Node or Bun needed): put
`dv.exe` and `dv1.cmd`…`dv6.cmd` from the release in one folder on `PATH`.
Build it yourself with `pnpm build:exe` (requires Bun) — output lands in
`release/`.

```bash
dv1 --help
```

## Quick Start

```bash
# Start Chrome with a profile
dv1 start

# Navigate to page
dv1 goto https://example.com

# Check status
dv1 status

# Interact with elements
dv1 click #button
dv1 fill #email "test@example.com"

# Monitor network
dv1 network

# Take screenshot
dv1 screenshot screenshot.png
```

## Features

### 🚀 74 Commands Across 13 CDP Domains

**Browser Management (7)**
- `start`, `stop`, `status`, `tabs`, `select`, `new`, `close`

**Navigation & Execution (7)**
- `navigate`, `reload`, `history`, `eval`, `snapshot`, `screenshot`, `read`

**Element Interaction (13)**
- `click`, `dblclick`, `check`, `uncheck`, `scroll-into-view`, `fill`, `type`, `key`, `hover`, `focus`, `drag`, `upload`, `find`

**DOM Manipulation (10)**
- `inspect`, `query`, `query-all`, `get-text`, `get-html`
- `set-text`, `set-html`, `set-attribute`, `highlight`, `watch`

**Element State & Box Model (7)**
- `is-visible`, `is-enabled`, `is-checked`, `value`, `attr`, `box`, `style`

**Clipboard & PDF (2)**
- `clipboard`, `pdf`

**Network Monitoring (5)**
- `network`, `intercept`, `request`, `clear-cache`, `har`

**Device Emulation (6)**
- `emulate`, `location`, `user-agent`, `timezone`, `throttle`, `reset`

**Storage Management (5)**
- `cookies`, `cookies-clear`, `storage-clear`
- `local-storage`, `session-storage`

**Console & Diagnostics (5)**
- `console`, `monitor`, `perf`, `dialog`, `a11y`

**Page Control (4)**
- `resize`, `scroll`, `frame`, `wait`

**Comparison & Batch (2)**
- `diff`, `batch`

**Profile Management (1)**
- `profiles`

## Key Features

### ✅ Network Monitoring & Interception
Monitor API calls, view request details, block or mock requests:
```bash
dv1 network --filter "api" --json
dv1 intercept --url "api.example.com" --action block
dv1 request --id <request-id> --body
```

### ✅ Enhanced DOM Manipulation
Inspect elements, modify content, set attributes:
```bash
dv1 inspect --selector "#button"
dv1 set-attribute --selector "#btn" --attr disabled --value "true"
dv1 query-all --selector ".item"
```

### ✅ Device Emulation
Test mobile scenarios with device emulation, geolocation, network throttling:
```bash
dv1 emulate --device iphone-13
dv1 location 37.7749 -122.4194
dv1 throttle --slow-3g
```

**Taking emulation back off.** A viewport override is per-tab and sticky: it survives
reloads, navigation and the CLI process exiting, so one stale `resize` otherwise governs
every later screenshot, hit-test and measurement.

```bash
dv1 resize 0 0            # clear the viewport override (0 means "no override")
dv1 reset                 # clear the whole bundle: viewport, UA, timezone, geolocation, throttle
dv1 reset --viewport      # or narrow it: --viewport --user-agent --timezone --geolocation --network
dv1 status                # flags any tab whose viewport does not match its window
```

Overrides are per-tab, and `resize` / `reset` talk to the same tab as every other dv
command — the first content tab. For anything else, name it or sweep the profile:

```bash
dv1 resize 0 0 --tab <id>            # clear one specific tab (ids come from dv1 status)
dv1 reset --viewport --all-tabs      # clear every open content tab
```

`dv1 status` reports the per-tab viewport and warns when it looks emulated:

```
  ○ 1. wui editor demo
     URL: http://localhost:5173/demo-editor.html
     Viewport: 900x700  ⚠ emulated — window is 1147x1241
```

The same numbers are in `status --json` under `tabs[].viewport` and a top-level
`emulatedTabs` count, and the hint names the tab when the emulated one is not the
default target. `status` only reports — it never changes emulation state. Use
`--no-viewport` to skip the probe.

When a tab cannot be judged, `status` says so instead of reporting "not emulated". A
tab that has never been in front has no window size to compare against, and a
`chrome://` page cannot be probed at all:

```
     Viewport: 390x844  ⚠ cannot tell — outerWidth, outerHeight reported as 0 — a tab
                          that has never been in front has no window size to compare against
     Viewport: not readable (tab did not answer)
```

`--json` / `--yaml` carry the same distinction: top-level `inconclusiveTabs` and
`unprobedTabs` counts, and per tab `viewport.conclusive` plus
`viewport.inconclusiveReason`. `emulatedTabs: 0` with `inconclusiveTabs: 2` means
two tabs were not checked — not that they are clean.

Two caveats worth knowing. A tab that is not in front keeps reporting the inner size
its widget last settled at, so a background tab can still read as emulated for a
while after its override is genuinely gone — `status` will not bring tabs to front to
get a cleaner number, because that would steal focus. And detection is a comparison,
not a flag Chrome exposes: an override close to the real window size in either
dimension (within ~40px wide or ~200px tall) is not reported, which is the price of
never crying wolf over docked DevTools.

**What survives the command, and what does not.** Every dv command is one CDP
connect/close, and a CDP override belongs to the connection that installed it. The
viewport size is the exception: Chrome keeps the resized widget after the session goes
away, which is why `resize 0 0` and `reset` exist at all. Everything else is gone
before the next command runs, and each command now says so in its own output.

`emulate --device` splits across that line, so it is worth stating plainly (measured
against Chrome 152):

| What `emulate` sets | After the command exits |
|---|---|
| Viewport width/height, and the CSS/media queries that follow from it | **persists** — the page keeps its mobile layout |
| `devicePixelRatio` | reverts to the display's own |
| `screen.width` / `screen.height` and the mobile flag | revert |
| User agent | reverts to desktop Chrome |

So a site that lays out by media query stays mobile, while a site that branches on the
user agent serves desktop HTML the moment it is re-fetched. `batch` does not help here:
it spawns one CLI process per step, so every step is its own session.

The fix is to load the page from inside the same command:

```bash
dv1 emulate -d iphone-13 --navigate https://example.com   # fetch under the device UA
dv1 emulate -d iphone-13 --reload                         # re-fetch the current page
```

Both wait for the load event before disconnecting, so the response the server picked for
that user agent is the HTML left on the page. Verified against a local echo server: the
request arrived as `Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 …)` while
`navigator.userAgent` read as desktop Chrome again on the next command.

Neither `resize 0 0` nor `reset` touches the real window bounds.

**Supported Devices:** `iphone-13`, `iphone-se`, `pixel-5`, `samsung-s21`,
`ipad-pro`, `ipad-air` (`emulate` with an unknown name lists them).

### ✅ Per-Tab Targeting: `--tab <id>`
Every command that talks to a page talks to exactly one tab. Without `--tab` that is
whichever tab comes first in Chrome's target list — and that order is *activation*
order, so it shifts as tabs are clicked. On a profile with more than one tab open, the
default target is not something a script can rely on.

`--tab <id>` pins it. All 64 page-facing commands accept it (`--tab-id` is kept as a
deprecated alias); the 10 that do not are the ones where it would be a lie — `start`,
`stop`, `status`, `tabs`, `new`, `close`, `profiles`, `clear-cache`,
`cookies-clear` and `batch`.

```bash
dv1 tabs                                  # tab ids
dv1 read --tab 6CF0E9E6618DFFDC2C2B62797B9EDD1B
dv1 eval --tab <id> --script "location.href"
dv1 storage-clear --tab <id> --type local  # clears that tab's origin, not the default tab's
```

A tab id that matches nothing fails loudly rather than quietly running somewhere else:

```
Error: No tab with ID NOPE123 on port 9231. List open tabs with: dv2 tabs
```

### ✅ Storage Management
View and manage cookies, localStorage, sessionStorage:
```bash
dv1 cookies --json
dv1 storage-clear --type local
dv1 local-storage --key "auth-token"
```

### ✅ Shadow DOM Query with `>>>` Pierce Syntax
Query elements inside Shadow DOM using the `>>>` syntax:
```bash
# Get HTML of element inside shadow root
dv3 query "my-component >>> .inner-btn" --html

# Get text content through nested shadow roots
dv3 query "outer >>> widget >>> .title" --text

# Get attribute value
dv3 query "x-input >>> input" --attr placeholder

# Count elements inside shadow root
dv3 query "my-list >>> .item" --count

# Check element exists
dv3 query "my-dialog >>> .modal" --exists

# JSON output
dv3 query "my-comp >>> .data" --html --json
```

The `>>>` operator is syntactic sugar that compiles to standard `element.shadowRoot.querySelector()` calls at runtime — no non-standard CSS involved.

**`>>>` also works on the interaction commands**, so you can drive elements that live inside Shadow DOM directly:

```bash
dv3 click "my-comp >>> .inner-btn"
dv3 hover "my-menu >>> .item"
dv3 focus "x-input >>> input"
dv3 drag --source "board >>> .card" --target "board >>> .column"
dv3 upload --selector "uploader >>> input[type=file]" --files ./photo.png
dv3 highlight "my-comp >>> .badge"
dv3 scroll --selector "my-list >>> .footer" -y 200
dv3 wait --selector "my-dialog >>> .ready"
```

Commands that accept a selector and act on the element — `click`, `hover`, `focus`, `drag`, `upload`, `highlight`, `scroll`, `wait`, `dblclick`, `check`, `uncheck`, `scroll-into-view`, `get-html`, `get-text`, `value`, `attr`, `box`, `style`, `set-text`, `set-html`, `set-attribute`, and `query-all` — all resolve `>>>` through the same shadow-piercing path as `query`.

A `>>>` selector that names a host with no shadow root — a closed root, a custom element that never attaches one, a plain element — is a miss, not an error: `--exists` reports `false`, `--count` reports `0`, `query-all` returns an empty list, and the commands that act on an element report `Element not found`. Every `>>>` segment must name an element; `"host >>>"` is rejected as an invalid selector rather than querying an empty string.

### ✅ Extended Element Interaction

Double-click, toggle and scroll-past-the-fold without writing JS:

```bash
dv1 dblclick #card            # double-click
dv1 check #agree              # tick a checkbox / radio
dv1 uncheck #opt-in           # untick it
dv1 scroll-into-view #footer  # scroll element into viewport
dv1 check "form >>> #agree"   # >>> shadow piercing supported
```

### ✅ Element State & Box Model

Inspect whether an element is visible, enabled or checked, and read its value, attributes, box metrics or computed styles:

```bash
dv1 is-visible --selector "#modal"
dv1 is-enabled --selector "#submit"
dv1 is-checked --selector "#agree"
dv1 value --selector "#email"
dv1 attr --selector "#btn" href
dv1 box --selector "#card" --json            # x, y, width, height + viewport coords
dv1 style --selector "#btn" --props color,display
```

All take `--json` / `--yaml`, and every selector accepts `>>>` for Shadow DOM piercing.

### ✅ Clipboard & PDF

Read, write, copy and paste the clipboard, or save the page as a PDF:

```bash
dv1 clipboard read
dv1 clipboard write "Hello"
dv1 clipboard copy --selector "#content"
dv1 clipboard paste --selector "#input"
dv1 pdf --output page.pdf
dv1 pdf --landscape --print-background
dv1 pdf --paper-width 8.5 --paper-height 11 --margin-top 0.5
```

### ✅ Computed CSS Styles as JSON

Read the resolved computed styles of any element (including deep inside Shadow DOM) as a JSON object with `--style`:

```bash
# All computed properties of a shadow-nested element, as JSON
dv3 query "my-custom-el >>> sy-a" --style --json

# Only specific properties
dv3 query "my-custom-el >>> sy-a" --style --props color,font-size,display --json

# Works on plain selectors too (human-readable output)
dv3 query ".btn" --style
```

Returns `null` if the element isn't found. `--props` accepts a comma-separated list; omit it to dump every longhand property from the element's `CSSStyleDeclaration`. (`--computed-style` is still accepted as a deprecated alias.)

> **PowerShell tip:** When using `--props` in PowerShell, quote the value to prevent comma-splitting:
> ```powershell
> dv1 query "my-comp >>> sy-a" --style --props "color,font-size,display" --json
> ```
> Without quotes, PowerShell interprets commas as array separators and flattens them into spaces, producing `--props "color font-size display"` — which the `split(/[\s,]+/)` parser still handles correctly, but quoting avoids ambiguity.

### ✅ Structured Output: `--json` and `--yaml`

Every data-returning command prints human-readable output by default, and accepts **both** `--json` and `--yaml` for programmatic use:

```bash
dv1 snapshot --json
dv1 snapshot --yaml
dv1 cookies --yaml
dv1 network --filter "/api" --json
dv1 query "my-comp >>> .price" --text --yaml
dv1 status --json
dv1 diff --compare before.json --yaml
```

Both formats serialize the identical data shape (JSON output is unchanged from previous releases). Commands covered: `status`, `snapshot`, `network`, `cookies`, `console`, `eval`, `local-storage`, `session-storage`, `tabs`, `new`, `request`, `query`, `query-all`, `inspect`, `get-text`, `get-html`, `read`, `find`, `diff`, `history --list`, `frame --list`, `a11y`, `perf`, `profiles`, `is-visible`, `is-enabled`, `is-checked`, `value`, `attr`, `box`, and `style`.

> Action commands that only report success (`click`, `fill`, `type`, `key`, `hover`, `focus`, `drag`, `upload`, `navigate`, `reload`, …) print a status line and do not take `--json` / `--yaml`. `har` writes a HAR file, which is JSON by definition.

### ✅ Reading Page Content & HTML

`read` extracts content from the current page (or fetches a URL over HTTP):

```bash
dv1 read                          # readable text (article/main/body heuristics)
dv1 read --text                   # raw page body text
dv1 read --snapshot               # accessibility tree
dv1 read --html                   # full document HTML (document.documentElement.outerHTML)
dv1 read --dom                    # alias for --html
dv1 read --html "my-comp >>> .card"   # outerHTML of one element (>>> supported)
dv1 read --text "#article"        # textContent of one element
dv1 read --url https://x.com      # HTTP fetch, no page needed
dv1 read --html --json            # any of the above as JSON/YAML
```

Element-level HTML/text is also available via `get-html` / `get-text`, both of which now support `>>>` shadow piercing and `--json` / `--yaml`:

```bash
dv1 get-html --selector "my-comp >>> .inner"
dv1 get-text --selector "my-comp >>> .title" --json
```

Each profile has its own command (`dv1`–`dv6`) to prevent AI agent collisions:
```bash
# Each agent uses a different command
dv1 start
dv2 start --headless
```

## Profile System

Pre-configured profiles for parallel testing:

| Profile | Port |
|---------|------|
| dv1 | 9230 |
| dv2 | 9231 |
| dv3 | 9232 |
| dv4 | 9233 |
| dv5 | 9234 |
| dv6 | 9235 |

All profiles support persistent OAuth sessions and can maintain authentication state.

```bash
dv1 start
dv1 status
```

## Example Workflows

### API Testing
```bash
dv1 start
dv1 goto https://myapp.com
dv1 network --filter "/api"
dv1 request --id <request-id> --body --json
```

### Mobile Testing
```bash
dv1 start
dv1 emulate --device iphone-13
dv1 location 37.7749 -122.4194
dv1 throttle --slow-3g
dv1 goto https://myapp.com
dv1 screenshot mobile-test.png
```

### Form Testing
```bash
dv1 fill #email "test@example.com"
dv1 fill #password "secret"
dv1 click #submit
dv1 console --type error
```

### Debugging
```bash
dv1 status
dv1 inspect --selector "#button"
dv1 get-html --selector "#container"
dv1 eval --script "localStorage.getItem('token')"
dv1 cookies
```

## Architecture

- **Language:** TypeScript 5.5
- **Runtime:** Node.js ≥18.0.0
- **Build:** tsc + tsx (ESM output)
- **Protocol:** Chrome DevTools Protocol via WebSocket
- **Dependencies:** ws, axios, commander, chalk, yaml

## CDP Coverage

13/56 domains (23.2% coverage):

- ✅ Browser HTTP API
- ✅ Page
- ✅ Runtime
- ✅ Console
- ✅ Input
- ✅ DOM
- ✅ DOMSnapshot
- ✅ DOMStorage
- ✅ Clipboard
- ✅ Emulation
- ✅ Network
- ✅ Storage

Focused on browser automation, testing, and debugging use cases.

## Comparison

**vs Puppeteer:**
- CLI-native (shell/bash scripting)
- No Node.js scripts required
- Simpler for quick operations

**vs Selenium:**
- Direct CDP protocol (lower-level, faster)
- No WebDriver overhead
- Modern Chrome-specific features

**vs Playwright:** see the full writeup below — the short version is dv is lighter
weight, CLI-first, and Chrome/Chromium only.

### Why dv, vs. every other browser-automation tool an agent could reach for

Agents given generic browser-automation tools tend to improvise: they spin up a new
remote-debugging port, create a throwaway or temp-copied profile, run several
instances concurrently against the same profile, lose the MCP connection mid-task,
or fall back to a clean/incognito context with no Google OAuth and no existing
logins. Individually these are reasonable defaults for the tools in question — but
for a workflow that depends on *the user's own logged-in browser*, each one means
starting over.

dv exists to close that gap: it is **session-able**, **pinned to six fixed Chrome
profiles** (`dv1`…`dv6`), each with its own persistent `user-data-dir` and its own
remote-debugging port (see the Profile System table above). An agent cannot create a
seventh profile, cannot point dv at an arbitrary `--profile` path, and cannot
silently spawn a second Chrome instance under it — the CLI simply doesn't expose
those knobs. That constraint is what makes the following possible in practice:

- **Real concurrency without session collisions.** Up to six independent tasks
  can each own a profile (`dv1 goto …` next to `dv2 goto …` next to `dv3 goto …`)
  without fighting over one browser's tabs or one profile's storage. Six is a
  practical ceiling for a single machine's screen space and memory, not a hard
  architectural limit.
- **The user's actual logins survive.** Because a profile is fixed and never
  reset unless asked, a human can log into Gmail (or anything gated behind
  Google OAuth, 2FA, or a CAPTCHA) in `dv2`'s window once, then hand the tab to
  an agent — "`dv2 goto gmail.com`" ... "I've logged in, continue from here" —
  and the agent inherits that session instead of hitting a blank auth wall.
- **No extra anti-bot surface.** dv drives the same real, persistent Chrome
  profile a human already uses — not a fresh incognito context or a
  differently-fingerprinted automation profile — so it doesn't introduce the
  "new machine, no history, no cookies" signal that anti-automation heuristics
  key on.
- **Selector-first, not purely ref-first.** dv's `snapshot`/`query`/`click` etc.
  support plain CSS selectors (including shadow-piercing `>>>` chains for
  custom-element/shadow-root heavy UIs) as first-class citizens, not just
  accessibility-tree element refs that go stale the moment the DOM mutates. An
  agent can still take an accessibility snapshot when useful, but it isn't
  required to re-snapshot after every DOM change just to keep its element
  handles valid.

#### Feature comparison

Facts below are sourced from each project's own docs/README as of the tools'
current public state; see citations under each subsection. Where a fact couldn't
be verified from a primary source it's marked "unclear" rather than guessed.

| | **dv** (this repo) | [browser-use](https://github.com/browser-use/browser-use) | [agent-browser](https://github.com/vercel-labs/agent-browser) (Vercel Labs) | [Browser MCP](https://github.com/browsermcp/mcp) (browsermcp.io) | [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) (Google) | [playwright-mcp](https://github.com/microsoft/playwright-mcp) (Microsoft) | Claude Code's [built-in browser](https://code.claude.com/docs/en/chrome) |
|---|---|---|---|---|---|---|---|
| **Profile model** | 6 fixed, pinned profiles (`dv1`–`dv6`), one `user-data-dir`/port each, cannot be reconfigured | Persistent profiles supported via config; also offers ephemeral cloud browsers | Default launches ephemeral browser; `--profile <path>` copies the user's Chrome profile into a **read-only temp snapshot** | Uses the browser's **existing** profile via a Chrome extension (no separate `user-data-dir`) | One shared `user-data-dir` per channel by default (not cleared between runs); `--isolated` for a temp dir | Persistent profile per workspace by default; `--isolated` or a distinct `--user-data-dir` for parallel clients | Explicitly a **clean profile with none of your logins** — separate from the Claude-in-Chrome extension |
| **Concurrent sessions** | Up to 6, one profile per task, by design | Multi-session support for parallel isolated runs (per project docs) | Not documented in the skill reference checked | Single real browser instance being remote-controlled — not built for N parallel isolated sessions | Shared dir across instances by default; concurrency needs `--isolated`/distinct dirs to avoid conflicts | Explicitly documented conflict: a persistent profile "can only be used by one browser instance at a time" — needs `--isolated`/distinct `--user-data-dir` per client | Single browser session in the desktop app side panel |
| **CDP port / concurrency mechanism** | Fixed pool of 6 ports baked into the CLI (`9230`–`9235`, one per `dv1`–`dv6` — see Profile System above); no port is ever invented at runtime | `--cdp <port\|ws-url>` connects to whatever you point it at; since only one process can bind a given debugging port, running N instances concurrently means manually tracking N distinct ports — no built-in pool | `--cdp` / `--auto-connect` connects to whatever's running or whatever port you give it; port/profile management for concurrency is left to the caller | Drives the browser through the extension's live connection, not a raw `--remote-debugging-port` the agent picks | Single shared `user-data-dir`/port by default; `--isolated` opens one more, ephemeral, on its own port — no fixed pool | Exposing a CDP port for its own self-launched browser is still an open feature request ([microsoft/playwright-mcp#1130](https://github.com/microsoft/playwright-mcp/issues/1130)); default mode is one profile, one instance at a time | Launches Chrome on port `9222`, one profile, one session — not designed for concurrency at all |
| **Preserves the user's real logins (Google OAuth etc.)** | Yes — it's the same fixed profile the human already logs into | Only if a persistent profile/storage state is explicitly configured | Only via `--profile`, and even then it's a copy, not the live profile, so new logins made by the agent don't write back | Yes — by design, via the real browser + extension | Yes, via the shared default profile (or explicit storage-state injection under `--isolated`) | Yes, via the shared per-workspace default profile (or explicit storage-state injection under `--isolated`) | No — clean profile by design, no existing logins |
| **Anti-bot / fingerprint risk** | Low — real, aged, persistent profile | Project also sells a paid cloud tier specifically adding "stealth" + residential proxies, implying the open-source default doesn't fully solve this | Unclear from docs reviewed | Low — real browser + extension, vendor claims it "avoids basic bot detection... by using your real browser fingerprint" | Depends on profile mode chosen | Depends on profile mode chosen | Low risk of bot-detection (it's a real Chrome context) but has no logins to trigger site-specific auth walls in the first place |
| **Element targeting** | CSS selectors (incl. shadow-piercing `>>>`), plus accessibility snapshot when wanted | LLM-driven DOM indexing | Accessibility-tree snapshots with `@eN` element refs | Not fully documented in sources reviewed | Accessibility-tree snapshot with refs (`uid`), refs invalidate on re-snapshot | Accessibility-tree snapshot with refs; Microsoft's own docs note refs go stale on DOM mutation and must be re-fetched | Standard browser interaction inside the app, not exposed as a scriptable ref API |
| **Primary interface** | CLI, scriptable and conversational | Python/TS SDK + hosted agent API | CLI, agent-first compact text output | MCP server + Chrome extension | MCP server | MCP server | Built into the Claude Code desktop app, not a standalone tool |
| **Maintainer** | This repo | browser-use (open source + commercial cloud) | Vercel Labs | Multiple unaffiliated projects share the "Browser MCP" name — confirm which fork before using; the `browsermcp/mcp` main repo predates it | Google Chrome DevTools team | Microsoft Playwright team | Anthropic |

#### Per-tool gap notes

**browser-use.** [browser-use](https://github.com/browser-use/browser-use) is an
open-source Python/TS agent framework with a companion paid cloud (stealth +
CAPTCHA-solving + residential proxies) and a Web UI that can keep a browser window
open between tasks. It's built around an LLM deciding actions over an indexed DOM,
and multi-session support exists for parallel isolated runs. The gap for our use
case: session persistence, stealth, and proxying are largely cloud/paid-tier or
config-dependent features rather than a zero-config default, and it isn't oriented
around a small fixed set of profiles an agent can address by name (`dv2`, `dv3`, …)
the way this workflow needs.

**agent-browser (Vercel Labs).** [agent-browser](https://github.com/vercel-labs/agent-browser)
is the closest thing to a named "agent-browser" tool on npm/GitHub (there's also an
unrelated `AIAnytime/agent-browser` embedded-browser project — different tool, same
name). It's a CLI aimed squarely at coding agents, with accessibility-tree `@eN`
refs and 50+ commands. Its own docs describe `--profile <path>` as copying the
user's Chrome profile into a **read-only temp directory** specifically so the
agent's session doesn't mutate the user's real profile. That's a deliberate safety
choice, but it also means it isn't meant to be "log in once as the human, then hand
the *same* live session to the agent" — which is exactly the workflow dv is built
around.

**Browser MCP (browsermcp.io).** [Browser MCP](https://github.com/browsermcp/mcp)
pairs an MCP server with a Chrome extension that controls the browser you're already
using, specifically to preserve logins and avoid the bot-detection signature of a
fresh automation profile — the same core idea dv leans on. The naming collision
matters here: there are several unaffiliated forks/projects called "Browser MCP" or
"browser-mcp" (`browsermcp/mcp`, `browsermcp-com/mcp`, `Agent360dk/browser-mcp`,
`DorianChn/browser-mcp`, `djyde/browser-mcp`, `ofershap/real-browser-mcp`) with
different maintainers and feature sets, so "browser mcp" as a category is fragmented
rather than one tool. It's also an MCP server, which inherits MCP's own failure
modes (a stdio/HTTP connection that can drop mid-session) that a plain CLI process
doesn't have.

**chrome-devtools-mcp (Google).** [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp)
is Google's official MCP wrapper around the DevTools Protocol. By default it
launches Chrome from its own fixed cache directory (e.g.
`%HOMEPATH%/.cache/chrome-devtools-mcp/chrome-profile-<channel>`) — a **different**
`user-data-dir` than any Chrome the user already has open, including one started by
dv. That's precisely the failure mode `CLAUDE.md` calls out: running it alongside dv
splits Chrome across two independent profile stores, so the tabs and logins an agent
was just using in dv are invisible to it, and vice versa. It has an `isolated`
option for a fully temp profile, but no notion of a small fixed pool of named,
addressable profiles.

**playwright-mcp (Microsoft) / plain Playwright / Puppeteer, in more detail.**
[playwright-mcp](https://github.com/microsoft/playwright-mcp) persists a profile per
workspace by default, but its own README documents the exact concurrency trap this
workflow needs to avoid: *"a persistent profile can only be used by one browser
instance at a time, so concurrent MCP clients sharing the same workspace will
conflict"* — the fix is `--isolated` or a distinct `--user-data-dir` per client, at
which point each client's session is disposable again, and logins made in one
context don't carry to another unless storage state is manually exported and
re-imported. Plain Playwright and Puppeteer have the same shape: they're drivers
that launch (or attach to) a browser under whatever `user-data-dir` you point them
at, with no built-in concept of a small set of named, durable, six-profile pool —
that policy has to be built and enforced by whoever calls them, which is exactly
what dv does and what `CLAUDE.md` forbids agents from re-implementing ad hoc.

**Stagehand / Browserbase.** [Stagehand](https://github.com/browserbase/stagehand)
is a code-first automation SDK (`act`/`extract`/`observe`/`agent` primitives,
natural-language actions instead of brittle CSS selectors) that runs by default on
Browserbase's managed cloud browsers, which handle stealth, residential proxies, and
session management as a hosted service. That's a good fit for scraping/data-extraction
workloads; it's a poor fit for "continue in the browser tab I'm already logged into
on my own machine," since the default execution target is a remote cloud browser,
not the user's local Chrome.

**Claude Code's built-in browser.** Claude Code's
[desktop in-app browser](https://code.claude.com/docs/en/chrome) (shipped July
2026) deliberately uses **a clean profile with none of the user's logins** — that's
stated as the explicit difference from the separate Claude-in-Chrome extension. It's
designed for safe, sandboxed browsing inside the IDE, not for "pick up my
already-authenticated Gmail tab." It's also a single browser instance per app
window, not a pool of independently addressable, concurrent sessions.

#### Where this leaves dv

None of the above tools are wrong for the problem they're solving — cloud-scale
scraping, sandboxed in-IDE browsing, or general MCP-based automation all have
legitimate reasons to prefer an ephemeral or cloud profile. dv is narrower on
purpose: **six fixed, real, persistent Chrome profiles, one CDP wrapper, no ports
or profile paths for an agent to invent.** That's the whole trick, and it's why
`CLAUDE.md` insists every agent working in or through this repo route browser work
through `dv1`…`dv6` and nothing else.

## Documentation

- [Quick Reference](QUICK-REFERENCE.md) - Command examples
- [Implementation Summary](IMPLEMENTATION-SUMMARY.md) - Full details
- [CDP Coverage](CDP-COVERAGE.md) - Domain coverage analysis
- [Changelog](CHANGELOG.md) - Version history

## License

ISC

## Author

missbjs

## Repository

https://github.com/missbjs/dv

## Keywords

chrome, devtools, cdp, cli, browser-automation, testing, debugging, selenium-alternative, puppeteer-alternative