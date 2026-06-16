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
# Start Chrome
dv start --port 9222 --headed

# Navigate to page
dv navigate --port 9222 --url https://example.com

# Check status
dv status --port 9222

# Interact with elements
dv click --port 9222 --selector "#button"
dv fill --port 9222 --selector "#email" --value "test@example.com"

# Monitor network
dv network --port 9222

# Take screenshot
dv screenshot --port 9222 --output screenshot.png
```

## Features

### 🚀 49 Commands Across 11 CDP Domains

**Browser Management (6)**
- `start`, `status`, `pages`, `select`, `new`, `close`

**Navigation & Execution (4)**
- `navigate`, `eval`, `snapshot`, `screenshot`

**Element Interaction (4)**
- `click`, `fill`, `type`, `key`

**DOM Manipulation (7)**
- `inspect`, `query-all`, `get-text`, `get-html`
- `set-text`, `set-html`, `set-attribute`

**Network Monitoring (4)**
- `network`, `intercept`, `request`, `clear-cache`

**Device Emulation (5)**
- `emulate`, `location`, `user-agent`, `timezone`, `throttle`

**Storage Management (5)**
- `cookies`, `cookies-clear`, `storage-clear`
- `local-storage`, `session-storage`

**Console & Monitoring (2)**
- `console`, `monitor`

**Viewport Control (1)**
- `resize`

**Profile Management (1)**
- `profiles`

## Key Features

### ✅ Network Monitoring & Interception
Monitor API calls, view request details, block or mock requests:
```bash
dv network --port 9222 --filter "api" --json
dv intercept --port 9222 --url "api.example.com" --action block
dv request --port 9222 --id <request-id> --body
```

### ✅ Enhanced DOM Manipulation
Inspect elements, modify content, set attributes:
```bash
dv inspect --port 9222 --selector "#button"
dv set-attribute --port 9222 --selector "#btn" --attr disabled --value "true"
dv query-all --port 9222 --selector ".item"
```

### ✅ Device Emulation
Test mobile scenarios with device emulation, geolocation, network throttling:
```bash
dv emulate --port 9222 --device iphone-13
dv location --port 9222 --lat 37.7749 --lng -122.4194
dv throttle --port 9222 --slow-3g
```

**Supported Devices:**
- iPhone 13, iPhone 13 Pro, iPhone SE
- Pixel 5, Samsung S21
- iPad Pro, iPad Air

### ✅ Storage Management
View and manage cookies, localStorage, sessionStorage:
```bash
dv cookies --port 9222 --json
dv storage-clear --port 9222 --type local
dv local-storage --port 9222 --key "auth-token"
```

### ✅ Mandatory Port Parameter
All commands require `--port` to prevent AI agent collisions:
```bash
# Each agent uses a different port
dv start --port 9222 --headed
dv start --port 9223 --headed
```

## Profile System

Pre-configured profiles for parallel testing:

| Profile | Port | Purpose |
|---------|------|---------|
| profile-qmdj-1 | 9222 | OAuth pinned |
| profile-qmdj-2 | 9223 | Parallel testing |
| profile-qmdj-3 | 9224 | Parallel testing |
| profile-qmdj-4 | 9225 | Parallel testing |
| profile-qmdj-5 | 9226 | Parallel testing |
| profile-qmdj-6 | 9227 | Parallel testing |

```bash
dv start --profile profile-qmdj-1
dv status --port 9222
```

## Example Workflows

### API Testing
```bash
dv start --port 9222 --headed
dv navigate --port 9222 --url https://myapp.com
dv network --port 9222 --filter "/api"
dv request --port 9222 --id <request-id> --body --json
```

### Mobile Testing
```bash
dv start --port 9222 --headed
dv emulate --port 9222 --device iphone-13
dv location --port 9222 --lat 37.7749 --lng -122.4194
dv throttle --port 9222 --slow-3g
dv navigate --port 9222 --url https://myapp.com
dv screenshot --port 9222 --output mobile-test.png
```

### Form Testing
```bash
dv fill --port 9222 --selector "#email" --value "test@example.com"
dv fill --port 9222 --selector "#password" --value "secret"
dv click --port 9222 --selector "#submit"
dv console --port 9222 --type error
```

### Debugging
```bash
dv status --port 9222
dv inspect --port 9222 --selector "#button"
dv get-html --port 9222 --selector "#container"
dv eval --port 9222 --script "localStorage.getItem('token')"
dv cookies --port 9222
```

## Architecture

- **Language:** TypeScript 5.5
- **Runtime:** Node.js ≥18.0.0
- **Build:** tsup (ESM output)
- **Protocol:** Chrome DevTools Protocol via WebSocket
- **Dependencies:** ws, axios, commander, chalk

## CDP Coverage

11/56 domains (19.6% coverage):

- ✅ Browser HTTP API
- ✅ Page
- ✅ Runtime
- ✅ Console
- ✅ Input
- ✅ DOM
- ✅ DOMSnapshot
- ✅ DOMStorage
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