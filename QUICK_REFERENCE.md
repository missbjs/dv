# dv-cli Quick Reference

## Installation

```bash
cd D:/developments/tslib/dv-cli
npm install
npm run build
npm link  # Optional: makes 'dv' available globally
```

## Most Common Commands

```bash
# Start Chrome
dv start --profile profile-qmdj-1 --headed

# Navigate
dv navigate --url http://localhost:3000

# Evaluate JS
dv eval --script "document.title"
dv eval --file ./script.js

# List pages
dv pages

# Select page
dv select --url "localhost:3000"

# Check console
dv console --type error

# Take screenshot
dv screenshot --output test.png

# Monitor console
dv monitor --types error,warn
```

## All Commands

| Command | Description | Example |
|---------|-------------|---------|
| `start` | Start Chrome | `dv start --profile profile-qmdj-1 --headed` |
| `navigate` | Navigate to URL | `dv navigate --url http://localhost:3000` |
| `eval` | Execute JavaScript | `dv eval --script "document.title"` |
| `pages` | List all pages | `dv pages` |
| `select` | Select page | `dv select --url "localhost:3000"` |
| `new` | Create new page | `dv new --url http://localhost:3000` |
| `close` | Close page | `dv close` |
| `console` | List console messages | `dv console --type error` |
| `screenshot` | Take screenshot | `dv screenshot --output test.png` |
| `snapshot` | Capture accessibility tree | `dv snapshot` |
| `click` | Click element | `dv click --selector ".btn"` |
| `fill` | Fill input | `dv fill --selector "#input" --value "test"` |
| `type` | Type text | `dv type --selector "#input" --text "text"` |
| `key` | Press key | `dv key --key Enter` |
| `resize` | Resize viewport | `dv resize --width 375 --height 667` |
| `monitor` | Monitor console | `dv monitor --types error,warn` |
| `profiles` | List profiles | `dv profiles` |

## Profiles

| Profile | Port | Purpose |
|---------|------|---------|
| profile-qmdj-1 | 9222 | OAuth pinned |
| profile-qmdj-2 | 9223 | Parallel testing |
| profile-qmdj-3 | 9224 | Parallel testing |
| profile-qmdj-4 | 9225 | Parallel testing |
| profile-qmdj-5 | 9226 | Parallel testing |
| profile-qmdj-6 | 9227 | Parallel testing |

## Common Flags

| Flag | Description | Used With |
|------|-------------|-----------|
| `--headed` | Run in headed mode | `start` |
| `--profile <name>` | Chrome profile | `start` |
| `--port <number>` | Debugging port | `start` |
| `--json` | JSON output | Most commands |
| `--url <url>` | Target URL | `navigate`, `select`, `new` |
| `--selector <css>` | CSS selector | `click`, `fill`, `type` |
| `--type <type>` | Message type | `console` |
| `--output <file>` | Output file | `screenshot` |

## Examples

### Test Workflow

```bash
dv start --profile profile-qmdj-1 --headed
dv navigate --url http://localhost:3000
dv eval --script "document.title"
dv console --type error
dv screenshot --output result.png
```

### Parallel Testing

```bash
# Terminal 1
dv start --profile profile-qmdj-1 --headed

# Terminal 2
dv start --profile profile-qmdj-2 --headed
```

### Scripting

```bash
#!/bin/bash
ERRORS=$(dv console --type error --json)
if [ "$ERRORS" != "[]" ]; then
  echo "Errors found!"
  exit 1
fi
```

### Monitor

```bash
dv monitor --types error,warn,log
# Press Ctrl+C to stop
```

## Session State

Session stored in `.dv-session.json`:
- Current page ID
- Current profile
- Port number

## Error Messages

Common errors and solutions:

| Error | Solution |
|-------|----------|
| Chrome not running | `dv start --profile profile-qmdj-1 --headed` |
| Page not found | `dv pages` to list available pages |
| Element not found | Check selector, ensure page loaded |
| Timeout | Increase timeout or check network |

## Platform Support

- ✅ Windows (`C:\Program Files\Google\Chrome\Application\chrome.exe`)
- ✅ macOS (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`)
- ✅ Linux (`google-chrome`)

## Tips

1. Use profiles for parallel testing
2. Always check console errors first
3. Use `--json` for scripting
4. Monitor in real-time with `dv monitor`
5. Resize viewport for mobile testing
6. Take screenshots to document issues