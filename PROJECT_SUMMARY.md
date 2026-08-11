# @missbjs/dv - Project Summary

## Overview

`@missbjs/dv` is a comprehensive TypeScript CLI tool that wraps Chrome DevTools Protocol with a clean, user-friendly command-line interface. It provides all the essential tools for browser automation, testing, and debugging, with 73 commands across 13 CDP domains.

## Project Location

```
D:/Developments/tslib/dv
```

## Installation & Setup

```bash
# Navigate to project
cd D:/Developments/tslib/dv

# Install dependencies
pnpm install

# Build the CLI (tsc only — no tsup)
pnpm build

# Link globally (optional)
pnpm link -g

# Or install directly from git
pnpm i -g github:missbjs/dv

# Use the CLI via a profile wrapper
dv1 --help
```

## Architecture

### Core Components

1. **CDP Client** (`src/cdp.ts`)
   - WebSocket connection management
   - Chrome DevTools Protocol communication
   - Session state persistence
   - Error handling and timeouts

2. **CLI Entry Point** (`src/cli.ts`)
   - Commander.js-based argument parsing
   - Command routing and dispatch
   - Help generation
   - Shadow DOM (`>>>`) selector resolution

3. **Commands** (`src/commands/`)
   - 73 specialized command modules
   - Each command handles a specific CDP operation
   - Consistent error handling and output formatting
   - Structured `--json` / `--yaml` output

4. **Profile Management** (`src/profiles.ts`)
   - 6 predefined Chrome profiles (dv1–dv6)
   - Port allocation (9230-9235)
   - Mandatory profile prefix prevents agent collisions

### Dependencies

- `commander` - CLI argument parsing
- `ws` - WebSocket client for CDP
- `axios` - HTTP client for Chrome endpoints
- `chalk` - Terminal coloring
- `yaml` - YAML structured output

## Command Categories

73 commands across:

- **Browser Management (7)** — start, stop, status, tabs, select, new, close
- **Navigation & Execution (7)** — goto, reload, history, eval, snapshot, screenshot, read
- **Element Interaction (13)** — click, dblclick, check, uncheck, scroll-into-view, fill, type, key, hover, focus, drag, upload, find
- **DOM Manipulation (10)** — inspect, query, query-all, get-text, get-html, set-text, set-html, set-attribute, highlight, watch
- **Element State & Box Model (7)** — is-visible, is-enabled, is-checked, value, attr, box, style
- **Clipboard & PDF (2)** — clipboard, pdf
- **Network Monitoring (5)** — network, intercept, request, clear-cache, har
- **Device Emulation (5)** — emulate, location, user-agent, timezone, throttle
- **Storage Management (5)** — cookies, cookies-clear, storage-clear, local-storage, session-storage
- **Console & Diagnostics (5)** — console, monitor, perf, dialog, a11y
- **Page Control (4)** — resize, scroll, frame, wait
- **Comparison & Batch (2)** — diff, batch
- **Profile Management (1)** — profiles

## Chrome Profiles

Six predefined profiles for parallel testing:

| Profile | Port |
|---------|------|
| dv1 | 9230 |
| dv2 | 9231 |
| dv3 | 9232 |
| dv4 | 9233 |
| dv5 | 9234 |
| dv6 | 9235 |

All profiles support persistent OAuth sessions.

## Session Management

The CLI discovers live tabs on each connection — no session state file is needed.

## Key Features

### 1. User-Friendly Errors

```bash
# Chrome not running
Error: Chrome is not running. Start it first with e.g. `dv1 start`

# Element not found
Error: Element not found: .non-existent-selector
```

### 2. Flexible Output

```bash
# Human-readable (default)
dv1 eval --script "document.title"
# Output: My Page Title

# JSON for scripting
dv1 eval --script "document.title" --json

# YAML output
dv1 cookies --yaml
```

### 3. Shadow DOM Piercing (`>>>`)

```bash
# Query inside a shadow root
dv1 query "my-comp >>> .inner-btn" --html

# Nested shadow roots
dv1 query "outer >>> widget >>> .title" --text

# Interact with elements inside shadow DOM
dv1 click "my-comp >>> .inner-btn"
dv1 box "sy-compass >>> #罗盘 >>> :nth-child(8) >>> :nth-child(1)" --json
```

### 4. Real-Time Monitoring

```bash
dv1 monitor --types error,warn
```

### 5. WebSocket Lifecycle
- 30-second timeout for all CDP operations
- Proper connect, send, receive, and close handling

## Usage Examples

### Basic Workflow

```bash
# 1. Start Chrome
dv1 start

# 2. Navigate
dv1 goto http://localhost:3000

# 3. Evaluate
dv1 eval --script "document.title"

# 4. Check console
dv1 console --type error

# 5. Screenshot
dv1 screenshot result.png
```

### Parallel Testing

```bash
# Terminal 1
dv1 start

# Terminal 2
dv2 start

# Terminal 3
dv3 start
```

### Shadow DOM State Inspection

```bash
# Get box model of a shadow-nested element
dv1 box "sy-compass >>> #罗盘 >>> :nth-child(8) >>> :nth-child(1)" --json

# Get computed styles
dv1 style "sy-compass >>> #罗盘 >>> :nth-child(8)" --props display,visibility --json

# Get an attribute
dv1 attr "xy-comp >>> a" href --json
```

### Automated Testing

```bash
#!/bin/bash
dv1 start
dv1 goto http://localhost:3000

ERRORS=$(dv1 console --type error --json)
if [ "$ERRORS" != "[]" ]; then
  echo "Errors found: $ERRORS"
  exit 1
fi

dv1 screenshot test-result.png
dv1 eval --script "window.testPassed" --json
```

## File Structure

```
dv/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── cdp.ts              # CDP client
│   ├── profiles.ts         # Profile management
│   ├── utils.ts            # Shadow piercing + output helpers
│   ├── types.ts            # TypeScript types
│   └── commands/           # 73 command implementations
│       ├── start.ts
│       ├── goto.ts
│       ├── eval.ts
│       ├── clock.ts
│       ├── dblclick.ts
│       ├── get-box.ts       # registered as `box`
│       ├── get-styles.ts    # registered as `style`
│       ├── clipboard.ts
│       ├── pdf.ts
│       └── ...
├── dist/                   # Built files
│   └── cli.js
├── package.json
├── tsconfig.json
├── README.md
├── EXAMPLES.md
├── QUICK-REFERENCE.md
├── CDP-COVERAGE.md
└── CHANGELOG.md
```

## Development

### Build

```bash
pnpm build        # tsc (ESM output)
```

### Test

```bash
pnpm test         # vitest (ports 9240-9245)
```

## Testing

The CLI has been tested with:
- ✅ Chrome startup and profile management
- ✅ Navigation and page selection
- ✅ JavaScript evaluation (inline and file)
- ✅ Console message listing and filtering
- ✅ Screenshot capture
- ✅ Page management (list, select, new, close)
- ✅ Real-time monitoring
- ✅ Shadow DOM piercing
- ✅ Element state & box model queries
- ✅ JSON / YAML output
- ✅ Error handling

## Notes

1. **Build**: Use `tsc` only — never `tsup` (see project constraint)
2. **Timeout Handling**: 30-second timeout for all CDP operations
3. **Error Messages**: Clear, actionable error messages for common issues
4. **Structured Output**: All data-returning commands support `--json` / `--yaml`
5. **Command Renames**: `value`/`attr`/`box`/`style` are primary; `get-value`/`get-attr`/`get-box`/`get-styles` remain aliases

## License

ISC

## Author

missbjs