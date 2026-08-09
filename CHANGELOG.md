# Changelog

## @missbjs/dv

### Unreleased

#### Added
- **`--yaml` output everywhere, alongside `--json`.** Every data-returning command (`status`, `snapshot`, `network`, `cookies`, `console`, `eval`, `local-storage`, `session-storage`, `tabs`, `new`, `request`, `query`, `query-all`, `inspect`, `get-text`, `get-html`, `read`, `find`, `diff`, `history --list`, `frame --list`, `a11y`, `perf`, `profiles`) now accepts both `--json` and `--yaml`. Human-readable output remains the default when neither flag is given. Both flags route through a shared `src/output.ts` formatter, so `--json` output is unchanged byte-for-byte and `--yaml` renders the exact same data shape.
- **`read --html` / `read --dom`** — dump the page's full HTML (`document.documentElement.outerHTML`), or a single element's `outerHTML` when a selector is passed (`read --html "my-comp >>> .card"`). `--dom` is an alias for `--html`. `read` also gained an optional `[selector]` argument (supports `>>>`) that scopes `--html` / `--text` output to one element.
- **`get-text` / `get-html` now support `>>>` shadow piercing** and `--json` / `--yaml`. Both previously used a raw `document.querySelector` that could not reach into Shadow DOM; they now build the element expression via the shared `buildElementExpression()` path used by `query`.
- `query --computed-style` — read an element's computed CSS styles as a JSON object, including elements deep inside Shadow DOM via the `>>>` pierce syntax. Use `--props color,font-size` to limit output to specific properties; omit to dump all longhands. Returns `null` when the element isn't found.
- **`>>>` shadow-pierce selectors now work on the interaction commands**, not just `query`. `click`, `hover`, `focus`, `drag` (source & target), `upload`, `highlight`, `scroll`, and `wait --selector` all resolve `>>>` through a shared `resolveNodeId()` path (`Runtime.evaluate` → `DOM.requestNode`), so you can target elements inside Shadow DOM directly (e.g. `dv1 click "my-comp >>> .btn"`).

#### Changed
- Unified element resolution in `cdp.ts` behind `resolveNodeId(selector)`, which handles plain CSS (via `DOM.querySelector`) and `>>>` shadow-pierce (via evaluated `shadowRoot.querySelector` chains) in one place. Previously each interaction command did its own `DOM.getDocument` + `DOM.querySelector`, none of which pierced Shadow DOM.
- Added a `yaml` dependency and a shared `src/output.ts` module (`wantsStructured` / `renderStructured` / `printStructured`). Structured output helpers were factored out of the per-command `if (options.json)` blocks so JSON and YAML stay consistent across the whole CLI.

> **Note:** Structured flags apply to commands that return data. Action commands that only report success (`click`, `fill`, `type`, `key`, `hover`, `focus`, `drag`, `upload`, `navigate`, `reload`, etc.) still print a human status line and intentionally do **not** take `--json` / `--yaml`. `har` also stays JSON-only (it writes a HAR file, which is JSON by definition).

#### Docs
- Updated README and QUICK-REFERENCE to cover all 59 commands (previously listed 49/50); documented the 19 commands added in the interaction/diagnostics batch (`hover`, `focus`, `drag`, `upload`, `find`, `highlight`, `watch`, `reload`, `history`, `read`, `har`, `perf`, `dialog`, `scroll`, `frame`, `wait`, `diff`, `batch`, `stop`).

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