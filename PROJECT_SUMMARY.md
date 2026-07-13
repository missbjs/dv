# dv-cli - Project Summary

## Overview

`dv-cli` is a comprehensive TypeScript CLI tool that wraps Chrome DevTools Protocol with a clean, user-friendly command-line interface. It provides all the essential tools for browser automation, testing, and debugging.

## Project Location

```
D:/developments/tslib/dv-cli
```

## Installation & Setup

```bash
# Navigate to project
cd D:/developments/tslib/dv-cli

# Install dependencies
npm install

# Build the CLI
npm run build

# Link globally (optional)
npm link

# Use the CLI
dv --help
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

3. **Commands** (`src/commands/`)
   - 15 specialized command modules
   - Each command handles a specific CDP operation
   - Consistent error handling and output formatting

4. **Profile Management** (`src/profiles.ts`)
   - 6 predefined Chrome profiles
   - Port allocation (9230-9235)
   - Purpose documentation

### Dependencies

- `commander` - CLI argument parsing
- `ws` - WebSocket client for CDP
- `axios` - HTTP client for Chrome endpoints
- `chalk` - Terminal coloring

## Available Commands

### Browser Management
- `dv start` - Start Chrome with debugging enabled
- `dv profiles` - List available profiles

### Navigation & Pages
- `dv navigate` - Navigate to URL
- `dv tabs` - List all open tabs
- `dv select` - Select a tab by URL/ID/index
- `dv new` - Open new tab
- `dv close` - Close tab

### JavaScript Execution
- `dv eval` - Execute JavaScript (inline or file)
- `dv snapshot` - Capture accessibility tree
- `dv screenshot` - Take screenshot

### Console & Monitoring
- `dv console` - List/filter console messages
- `dv monitor` - Real-time console monitoring

### Interactions
- `dv click` - Click element
- `dv fill` - Fill input (clear + type)
- `dv type` - Type text (append)
- `dv key` - Press key

### Viewport
- `dv resize` - Resize viewport

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
dv eval --script "document.title"
# Output: My Page Title

# JSON for scripting
dv eval --script "document.title" --json
# Output: {"result":{"type":"string","value":"My Page Title"}}
```

### 3. Real-Time Monitoring

```bash
# Monitor console messages
dv monitor --types error,warn

# Streaming output:
[error] Failed to load resource...
[warn] Deprecated API usage...
^C
Stopping monitor...
```

### 4. Script Execution

```bash
# Inline script
dv eval --script "document.querySelectorAll('div').length"

# From file
dv eval --file ./test-script.js
```

### 5. Cross-Platform Support

Automatic Chrome detection:
- **Windows**: `C:\Program Files\Google\Chrome\Application\chrome.exe`
- **macOS**: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- **Linux**: `google-chrome`

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
dv-cli/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── cdp.ts              # CDP client
│   ├── profiles.ts         # Profile management
│   ├── types.ts            # TypeScript types
│   └── commands/           # Command implementations
│       ├── start.ts
│       ├── navigate.ts
│       ├── eval.ts
│       ├── console.ts
│       ├── snapshot.ts
│       ├── screenshot.ts
│       ├── click.ts
│       ├── fill.ts
│       ├── type.ts
│       ├── key.ts
│       ├── pages.ts
│       ├── select.ts
│       ├── new.ts
│       ├── close.ts
│       ├── resize.ts
│       └── monitor.ts
├── dist/                   # Built files
│   └── cli.js
├── package.json
├── tsconfig.json
├── README.md
├── EXAMPLES.md
├── .gitignore
└── test-script.js
```

## Development

### Build

```bash
npm run build
```

### Development Mode (Watch)

```bash
npm run dev
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
- ✅ JSON output
- ✅ Error handling

## Notes

1. **WebSocket Lifecycle**: Properly handles connect, send, receive, and close operations
2. **Timeout Handling**: 30-second timeout for all CDP operations
3. **Error Messages**: Clear, actionable error messages for common issues
6. **JSON Output**: All commands support `--json` flag for scripting

## Future Enhancements

Potential improvements:
- [ ] Add `dv wait` command for waiting on conditions
- [ ] Add `dv hover` command for hover interactions
- [ ] Add `dv scroll` command for scrolling
- [ ] Add `dv upload` command for file uploads
- [ ] Add network request interception
- [ ] Add performance profiling commands
- [ ] Add cookie management commands
- [ ] Add storage/localStorage commands
- [ ] Support for custom Chrome executable path
- [ ] Configuration file for custom profiles

## License

ISC

## Author

@anthropic