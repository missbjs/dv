# @missbjs/dv

**Chrome DevTools Protocol CLI** - A comprehensive TypeScript CLI tool for browser automation, testing, and debugging.

## Installation

```bash
npm install -g @missbjs/dv
```

Or use directly:

```bash
npx @missbjs/dv --help
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

### 🚀 73 Commands Across 13 CDP Domains

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

**Device Emulation (5)**
- `emulate`, `location`, `user-agent`, `timezone`, `throttle`

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

**Supported Devices:**
- iPhone 13, iPhone 13 Pro, iPhone SE
- Pixel 5, Samsung S21
- iPad Pro, iPad Air

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

Commands that accept a selector and act on the element — `click`, `hover`, `focus`, `drag`, `upload`, `highlight`, `scroll`, `wait`, `dblclick`, `check`, `uncheck`, `scroll-into-view`, `get-html`, `get-text`, `value`, `attr`, `box`, and `style` — all resolve `>>>` through the same shadow-piercing path as `query`.

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

**vs Playwright:**
- Lighter weight
- CLI-first design
- Chrome/Chromium only

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