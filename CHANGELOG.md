# Changelog

## @missbjs/dv

### Unreleased

#### Added
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
- **`get-box` → `box`, `get-styles` → `style`, `get-value` → `value`, `get-attr` → `attr`** — the four `get-*` state query commands are now primary under their short names. The `get-*` forms are still accepted as backward-compatible aliases.
- **`--tab-id` → `--tab`** — the deprecated `--tab-id` option is replaced by `--tab` across `console`, `select`, and `close` commands. `--tab-id` is still accepted as a backward-compatible alias.
- **`--computed-style` → `--style`** on the `query` command. `--computed-style` is still accepted as a deprecated alias.
- Updated CDP coverage: 13 domains (23.2%), up from 11 (19.6%).

#### Docs
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