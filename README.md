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
dv start --profile profile-1 --headed

# Navigate to page
dv navigate --profile profile-1 --url https://example.com

# Check status
dv status --profile profile-1

# Interact with elements
dv click --profile profile-1 --selector "#button"
dv fill --profile profile-1 --selector "#email" --value "test@example.com"

# Monitor network
dv network --profile profile-1

# Take screenshot
dv screenshot --profile profile-1 --output screenshot.png
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
dv network --profile profile-1 --filter "api" --json
dv intercept --profile profile-1 --url "api.example.com" --action block
dv request --profile profile-1 --id <request-id> --body
```

### ✅ Enhanced DOM Manipulation
Inspect elements, modify content, set attributes:
```bash
dv inspect --profile profile-1 --selector "#button"
dv set-attribute --profile profile-1 --selector "#btn" --attr disabled --value "true"
dv query-all --profile profile-1 --selector ".item"
```

### ✅ Device Emulation
Test mobile scenarios with device emulation, geolocation, network throttling:
```bash
dv emulate --profile profile-1 --device iphone-13
dv location --profile profile-1 --lat 37.7749 --lng -122.4194
dv throttle --profile profile-1 --slow-3g
```

**Supported Devices:**
- iPhone 13, iPhone 13 Pro, iPhone SE
- Pixel 5, Samsung S21
- iPad Pro, iPad Air

### ✅ Storage Management
View and manage cookies, localStorage, sessionStorage:
```bash
dv cookies --profile profile-1 --json
dv storage-clear --profile profile-1 --type local
dv local-storage --profile profile-1 --key "auth-token"
```

### ✅ Mandatory Profile Parameter
All commands require `--profile` to prevent AI agent collisions:
```bash
# Each agent uses a different profile
dv start --profile profile-1 --headed
dv start --profile profile-2 --headed
```

## Profile System

Pre-configured profiles for parallel testing:

| Profile | Port | Purpose |
|---------|------|---------|
| profile-1 | 9230 | General use |
| profile-2 | 9231 | Parallel testing |
| profile-3 | 9232 | Parallel testing |
| profile-4 | 9233 | Parallel testing |
| profile-5 | 9234 | Parallel testing |
| profile-6 | 9235 | Parallel testing |

All profiles support persistent OAuth sessions and can maintain authentication state.

```bash
dv start --profile profile-1
dv status --profile profile-1
```

## Example Workflows

### API Testing
```bash
dv start --profile profile-1 --headed
dv navigate --profile profile-1 --url https://myapp.com
dv network --profile profile-1 --filter "/api"
dv request --profile profile-1 --id <request-id> --body --json
```

### Mobile Testing
```bash
dv start --profile profile-1 --headed
dv emulate --profile profile-1 --device iphone-13
dv location --profile profile-1 --lat 37.7749 --lng -122.4194
dv throttle --profile profile-1 --slow-3g
dv navigate --profile profile-1 --url https://myapp.com
dv screenshot --profile profile-1 --output mobile-test.png
```

### Form Testing
```bash
dv fill --profile profile-1 --selector "#email" --value "test@example.com"
dv fill --profile profile-1 --selector "#password" --value "secret"
dv click --profile profile-1 --selector "#submit"
dv console --profile profile-1 --type error
```

### Debugging
```bash
dv status --profile profile-1
dv inspect --profile profile-1 --selector "#button"
dv get-html --profile profile-1 --selector "#container"
dv eval --profile profile-1 --script "localStorage.getItem('token')"
dv cookies --profile profile-1
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