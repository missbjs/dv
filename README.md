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

### 🚀 49 Commands Across 11 CDP Domains

**Browser Management (6)**
- `start`, `status`, `tabs`, `select`, `new`, `close`

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

### ✅ Profile-Based Command Names
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