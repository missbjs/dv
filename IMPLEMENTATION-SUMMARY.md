# Implemented Commands Summary

## Package: @missbjs/dv

Chrome DevTools Protocol CLI - A comprehensive TypeScript CLI tool for browser automation, testing, and debugging.

## Total Commands: 73

### Browser Management (7)
- `start` - Start Chrome with remote debugging
- `stop` - Stop Chrome process
- `status` - Check if Chrome is running
- `tabs` - List open tabs
- `select` - Select tab by URL, ID, or index
- `new` - Open new tab
- `close` - Close tab

### Navigation & Execution (7)
- `goto` - Navigate to URL
- `reload` - Reload the current page
- `history` - Browser history navigation (back/forward/list)
- `eval` - Evaluate JavaScript
- `snapshot` - Take accessibility snapshot
- `screenshot` - Take screenshot
- `read` - Read page content (text, HTML, snapshot, or fetch URL)

### Element Interaction (13)
- `click` - Click element
- `dblclick` - Double-click element
- `check` - Check a checkbox / radio button
- `uncheck` - Uncheck a checkbox
- `scroll-into-view` - Scroll element into viewport
- `fill` - Fill input (clears existing value)
- `type` - Type text (appends to existing)
- `key` - Press a key
- `hover` - Hover element
- `focus` - Focus element
- `drag` - Drag element to target
- `upload` - Upload file(s)
- `find` - Semantic locator (find by text, then click/focus)

### DOM Manipulation (10)
- `inspect` - Inspect element details
- `query` - Query single element (supports `>>>` shadow piercing, `--text`, `--html`, `--attr`, `--count`, `--exists`, `--style`)
- `query-all` - Query all matching elements
- `get-text` - Get element text content
- `get-html` - Get element HTML
- `set-text` - Set element text content
- `set-html` - Set element HTML
- `set-attribute` - Set element attribute
- `highlight` - Highlight element
- `watch` - Watch DOM mutations in real-time

### Element State & Box Model (7)
- `is-visible` - Check element visibility
- `is-enabled` - Check element enabled state
- `is-checked` - Check checkbox/radio state
- `value` - Get input value (alias: `get-value`)
- `attr` - Get element attribute (alias: `get-attr`)
- `box` - Get element box model (x, y, width, height, center) (alias: `get-box`)
- `style` - Get computed CSS styles (alias: `get-styles`)

### Clipboard & PDF (2)
- `clipboard` - Read/write/copy/paste clipboard
- `pdf` - Export page as PDF

### Network Monitoring (5)
- `network` - List network requests
- `intercept` - Intercept/block/mock requests
- `request` - Get request/response details
- `clear-cache` - Clear browser cache
- `har` - Export network activity as HAR

### Device Emulation (5)
- `emulate` - Emulate device (iPhone, Pixel, etc.)
- `location` - Set geolocation override
- `user-agent` - Set user agent override
- `timezone` - Set timezone override
- `throttle` - Throttle network (offline, 3G)

### Storage Management (5)
- `cookies` - List cookies
- `cookies-clear` - Clear cookies
- `storage-clear` - Clear localStorage/sessionStorage
- `local-storage` - List localStorage items
- `session-storage` - List sessionStorage items

### Console & Diagnostics (5)
- `console` - List console messages
- `monitor` - Monitor console in real-time
- `perf` - Performance metrics
- `dialog` - Handle alert/confirm/prompt dialogs
- `a11y` - Accessibility info

### Page Control (4)
- `resize` - Resize viewport
- `scroll` - Scroll page
- `frame` - Set/switch frame
- `wait` - Wait for element or network idle

### Comparison & Batch (2)
- `diff` - Compare snapshots
- `batch` - Run commands sequentially

### Profile Management (1)
- `profiles` - List available profiles

---

## Network Domain Commands

**network** - List network requests
```bash
dv1 network --filter "api" --json
```
- Monitors all HTTP requests
- Shows request URLs, methods, statuses
- Filter by URL pattern
- JSON output support

**intercept** - Intercept network requests
```bash
dv1 intercept --url "api.example.com" --action block
dv1 intercept --url "api.mock.com" --action mock --response '{"data":"mock"}'
```
- Block requests
- Mock responses
- Pattern matching

**request** - Get request details
```bash
dv1 request --id <request-id>
dv1 request --id <request-id> --body --json
```
- View request/response details
- View response body
- JSON output

**clear-cache** - Clear browser cache
```bash
dv1 clear-cache
```
- Clears all browser cache
- Useful for testing cache behavior

**har** - Export network activity as HAR
```bash
dv1 har session.har
```
- Writes standard HAR file
- Complete request/response archive

---

## Enhanced DOM Commands

**inspect** - Inspect element details
```bash
dv1 inspect --selector "#button"
dv1 inspect --selector ".container" --json
```
- Shows element attributes
- Shows box model
- Node ID information

**query** - Query single element
```bash
dv1 query "my-comp >>> .btn" --html
dv1 query "my-comp >>> .title" --text
dv1 query "my-comp >>> input" --attr placeholder
dv1 query ".list-item" --count
dv1 query ".modal" --exists
dv1 query "my-comp >>> sy-a" --style --json
```
- Supports `>>>` shadow DOM piercing
- Options: `--text`, `--html`, `--attr`, `--count`, `--exists`, `--style`, `--json`, `--yaml`

**query-all** - Query all matching elements
```bash
dv1 query-all --selector "button"
dv1 query-all --selector ".item" --json
```
- Returns all matching elements
- Count and node IDs

**get-text** - Get element text content
```bash
dv1 get-text --selector "#title"
```
- Returns text content
- Simple console output

**get-html** - Get element HTML
```bash
dv1 get-html --selector "#container"
```
- Returns outerHTML
- Full HTML structure

**set-text** - Set element text content
```bash
dv1 set-text --selector "#title" --value "New Title"
```
- Updates text content
- Safe for plain text

**set-html** - Set element HTML
```bash
dv1 set-html --selector "#container" --value "<div>New HTML</div>"
```
- Updates innerHTML
- Supports HTML content

**set-attribute** - Set element attribute
```bash
dv1 set-attribute --selector "#button" --attr disabled --value "true"
```
- Set any attribute
- Modify element properties

---

## Element State & Box Model

**is-visible** - Check element visibility
```bash
dv1 is-visible --selector "#modal"
dv1 is-visible --selector "my-comp >>> .inner" --json
```
- Uses `el.checkVisibility()`
- Returns true/false

**is-enabled** - Check element enabled state
```bash
dv1 is-enabled --selector "#submit"
```
- Checks `el.disabled` property
- Returns true/false

**is-checked** - Check checkbox/radio state
```bash
dv1 is-checked --selector "#agree"
```
- Checks `el.checked` property
- Returns true/false

**value** - Get input value
```bash
dv1 value --selector "#email"
dv1 value --selector "my-comp >>> input" --json
```
- Returns `el.value`
- Supports `>>>` shadow piercing

**attr** - Get element attribute
```bash
dv1 attr --selector "#btn" href
dv1 attr --selector "my-comp >>> a" target --json
```
- Returns attribute value or null
- Supports `>>>` shadow piercing

**box** - Get element box model
```bash
dv1 box --selector "#card" --json
```
- Returns x, y, width, height, center (viewport coords)
- Uses `DOM.getBoxModel` + `DOM.getContentQuads`

**style** - Get computed CSS styles
```bash
dv1 style --selector "#btn" --props color,display
dv1 style --selector "my-comp >>> .el" --json
```
- Returns computed `CSSStyleDeclaration`
- `--props` filters to specific properties

---

## Clipboard & PDF

**clipboard** - Read/write/copy/paste
```bash
dv1 clipboard read
dv1 clipboard write "Hello"
dv1 clipboard copy --selector "#content"
dv1 clipboard paste --selector "#input"
```
- Uses `Clipboard.readText`/`writeText` CDP methods
- `copy`/`paste` use `execCommand` fallback

**pdf** - Export page as PDF
```bash
dv1 pdf --output page.pdf
dv1 pdf --landscape --print-background
dv1 pdf --paper-width 8.5 --paper-height 11 --margin-top 0.5
```
- Uses `Page.printToPDF`
- Options: paper size, margins, landscape, print-background, page ranges

---

## Device Emulation Commands

**emulate** - Emulate device
```bash
dv1 emulate --device iphone-13
dv1 emulate --device pixel-5
```

Supported Devices:
- iphone-13, iphone-13-pro, iphone-se
- pixel-5, samsung-s21
- ipad-pro, ipad-air

Sets viewport size, device scale factor, user agent, mobile flag.

**location** - Set geolocation
```bash
dv1 location 37.7749 -122.4194
dv1 location 40.7128 -74.0060 --accuracy 10
```
- Override geolocation
- Test location-based features

**user-agent** - Set user agent
```bash
dv1 user-agent --ua "Mozilla/5.0..."
```
- Custom user agent
- Test browser detection

**timezone** - Set timezone
```bash
dv1 timezone --tz "America/New_York"
dv1 timezone --tz "Asia/Tokyo"
```
- Override timezone
- Test timezone-dependent features

**throttle** - Throttle network
```bash
dv1 throttle --offline
dv1 throttle --slow-3g
dv1 throttle --fast-3g
```
- Offline mode
- Slow 3G (500 Kbps, 2s latency)
- Fast 3G (1.6 Mbps, 560ms latency)

---

## Storage Commands

**cookies** - List cookies
```bash
dv1 cookies
dv1 cookies --domain example.com --json
```
- List all cookies
- Filter by domain
- Shows name, value, domain, path, expiry

**cookies-clear** - Clear cookies
```bash
dv1 cookies-clear
dv1 cookies-clear --domain example.com
```
- Clear all cookies
- Clear domain-specific cookies

**storage-clear** - Clear storage
```bash
dv1 storage-clear --type local
dv1 storage-clear --type session
dv1 storage-clear --type all
```
- Clear localStorage
- Clear sessionStorage
- Clear both

**local-storage** - List localStorage items
```bash
dv1 local-storage
dv1 local-storage --key "auth-token" --json
```
- List all localStorage
- Filter by key
- JSON output

**session-storage** - List sessionStorage items
```bash
dv1 session-storage
dv1 session-storage --key "session-id" --json
```
- List all sessionStorage
- Filter by key
- JSON output

---

## Console & Diagnostics

**console** - List console messages
```bash
dv1 console
dv1 console --type error
dv1 console --type log --filter "API"
```
- Lists all console messages
- Filter by type (error, warn, log, info)
- Filter by text pattern

**monitor** - Real-time console monitoring
```bash
dv1 monitor --types error,warn
```
- Streams console messages in real-time
- Press Ctrl+C to stop

**perf** - Performance metrics
```bash
dv1 perf
dv1 perf --json
```
- Shows performance timing data
- JSON output for scripting

**dialog** - Handle dialogs
```bash
dv1 dialog --accept
dv1 dialog --dismiss
dv1 dialog --text "input"
```
- Handle alert/confirm/prompt dialogs
- Auto-accept, dismiss, or provide text

**a11y** - Accessibility info
```bash
dv1 a11y --selector "#nav"
dv1 a11y --json
```
- Accessibility tree information
- ARIA attributes

---

## Page Control

**scroll** - Scroll page
```bash
dv1 scroll -y 500
dv1 scroll --selector "#panel" -y 200
```
- Scroll window or element
- Supports `>>>` shadow piercing

**frame** - Set/switch frame
```bash
dv1 frame --selector "iframe#checkout"
dv1 frame --list
```
- Switch to iframe context
- List all frames

**wait** - Wait for condition
```bash
dv1 wait --selector "#done"
dv1 wait --selector "my-dialog >>> .ready"
dv1 wait --networkidle
dv1 wait --ms 1000
```
- Wait for element to appear
- Wait for network idle
- Wait for timeout

---

## CDP Domain Coverage

**13/56 domains (23.2%)**

- ✅ Browser HTTP API
- ✅ Page
- ✅ Runtime
- ✅ Console
- ✅ Input
- ✅ DOM (enhanced)
- ✅ DOMSnapshot
- ✅ Clipboard
- ✅ Emulation (enhanced)
- ✅ Network
- ✅ Storage
- ✅ DOMStorage
- ✅ Accessibility

---

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

All commands require a profile as a command prefix to prevent agent collisions:
```bash
dv1 start
dv1 goto https://example.com
dv1 click #btn
```

---

## Example Workflows

### Network Debugging
```bash
dv1 start
dv1 goto https://example.com
dv1 network --filter "api"
dv1 request --id <request-id> --body
dv1 clear-cache
```

### Mobile Testing
```bash
dv1 start
dv1 emulate --device iphone-13
dv1 location 37.7749 -122.4194
dv1 throttle --slow-3g
dv1 goto https://example.com
dv1 cookies
```

### DOM Manipulation
```bash
dv1 inspect --selector "#button"
dv1 query-all --selector ".item"
dv1 get-text --selector "#title"
dv1 set-text --selector "#title" --value "New Title"
dv1 set-attribute --selector "#button" --attr disabled --value "true"
dv1 get-html --selector "#container"
```

### Shadow DOM Interactions
```bash
dv1 click "my-comp >>> .inner-btn"
dv1 query "my-comp >>> .title" --text --json
dv1 box "my-comp >>> .card" --json
dv1 style "my-comp >>> .el" --props color,display --json
```

### Element State Inspection
```bash
dv1 is-visible --selector "#modal"
dv1 is-enabled --selector "#submit"
dv1 is-checked --selector "#agree"
dv1 value --selector "#email" --json
dv1 attr --selector "#btn" href --json
```

---

## Architecture

### CDPClient (src/cdp.ts)
- WebSocket connection management
- Network request tracking
- Network interception support
- Enhanced DOM manipulation methods
- Emulation methods
- Storage management methods
- State persistence

### Command Files
All 73 commands in `src/commands/`:
- Browser: start.ts, stop.ts, status.ts, pages.ts, select.ts, new.ts, close.ts
- Navigation: navigate.ts, goto.ts, reload.ts, history.ts, eval.ts, snapshot.ts, screenshot.ts, read.ts
- Interaction: click.ts, dblclick.ts, check.ts, uncheck.ts, scroll-into-view.ts, fill.ts, type.ts, key.ts, hover.ts, focus.ts, drag.ts, upload.ts, find.ts
- DOM: inspect.ts, query.ts, query-all.ts, get-text.ts, get-html.ts, set-text.ts, set-html.ts, set-attribute.ts, highlight.ts, watch.ts
- State: is-visible.ts, is-enabled.ts, is-checked.ts, get-value.ts, get-attr.ts, get-box.ts, get-styles.ts
- Clipboard & PDF: clipboard.ts, pdf.ts
- Network: network.ts, intercept.ts, request.ts, clear-cache.ts, har.ts
- Emulation: emulate.ts, location.ts, user-agent.ts, timezone.ts, throttle.ts
- Storage: cookies.ts, cookies-clear.ts, storage-clear.ts, local-storage.ts, session-storage.ts
- Console: console.ts, monitor.ts, perf.ts, dialog.ts, a11y.ts
- Page: resize.ts, scroll.ts, frame.ts, wait.ts
- Comparison: diff.ts, batch.ts
- Profile: profiles.ts

### Profile System (src/profiles.ts)
- 6 pre-configured profiles
- Fixed port assignments (9230-9235)
- Profile validation

### Shadow DOM Piercing
- `>>>` operator compiles to `element.shadowRoot.querySelector()` at runtime
- Supported on all selector-based commands: query, click, hover, focus, drag, upload, check, uncheck, dblclick, scroll-into-view, highlight, scroll, wait, get-text, get-html, value, attr, box, style
- Nested shadow roots supported: `outer >>> widget >>> .item`

### Structured Output
- `--json` and `--yaml` flags on all data-returning commands
- Action commands (click, fill, type, etc.) print status lines only

---

## Summary

✅ 73 commands implemented
✅ 13/56 CDP domains covered (23.2%)
✅ Network monitoring and interception
✅ Enhanced DOM manipulation
✅ Shadow DOM piercing (`>>>`)
✅ Device emulation
✅ Storage management
✅ Element state & box model queries
✅ Clipboard & PDF export
✅ Profile-based parallel execution
✅ Structured JSON/YAML output
✅ Mandatory profile command prefix prevents agent collisions
✅ Comprehensive error handling

The CLI provides comprehensive browser automation, testing, and debugging capabilities for AI agents and developers.