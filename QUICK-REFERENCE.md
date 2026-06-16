# DV CLI Quick Reference

## Total Commands: 49

### Browser Management
```bash
dv start --port 9222 --headed
dv start --profile profile-qmdj-1
dv status --port 9222
dv pages --port 9222
dv select --port 9222 --url "example"
dv close --port 9222
```

### Navigation & Execution
```bash
dv navigate --port 9222 --url https://example.com
dv new --port 9222 --url https://example.com
dv eval --port 9222 --script "document.title"
dv eval --port 9222 --file script.js
```

### Element Interaction
```bash
dv click --port 9222 --selector "#button"
dv fill --port 9222 --selector "#input" --value "text"
dv type --port 9222 --selector "#input" --text "more"
dv key --port 9222 --key Enter
```

### DOM Manipulation (NEW)
```bash
dv inspect --port 9222 --selector "#button"
dv query-all --port 9222 --selector ".item"
dv get-text --port 9222 --selector "#title"
dv get-html --port 9222 --selector "#container"
dv set-text --port 9222 --selector "#title" --value "New"
dv set-html --port 9222 --selector "#div" --value "<p>HTML</p>"
dv set-attribute --port 9222 --selector "#btn" --attr disabled --value "true"
```

### Network Monitoring (NEW)
```bash
dv network --port 9222
dv network --port 9222 --filter "api" --json
dv intercept --port 9222 --url "api.example.com" --action block
dv request --port 9222 --id <id> --body
dv clear-cache --port 9222
```

### Device Emulation (NEW)
```bash
dv emulate --port 9222 --device iphone-13
dv emulate --port 9222 --device pixel-5
dv location --port 9222 --lat 37.7749 --lng -122.4194
dv user-agent --port 9222 --ua "Mozilla/5.0..."
dv timezone --port 9222 --tz "America/New_York"
dv throttle --port 9222 --slow-3g
dv throttle --port 9222 --offline
```

### Storage Management (NEW)
```bash
dv cookies --port 9222
dv cookies --port 9222 --domain example.com --json
dv cookies-clear --port 9222
dv storage-clear --port 9222 --type local
dv storage-clear --port 9222 --type session
dv storage-clear --port 9222 --type all
dv local-storage --port 9222
dv session-storage --port 9222
```

### Screenshots & Snapshots
```bash
dv screenshot --port 9222 --output page.png
dv snapshot --port 9222 --json
```

### Console & Monitoring
```bash
dv console --port 9222
dv console --port 9222 --type error
dv monitor --port 9222 --types error,warn
```

### Viewport Control
```bash
dv resize --port 9222 --width 1920 --height 1080
```

## Profiles (Port Assignments)
```
profile-qmdj-1 → port 9222 (OAuth pinned)
profile-qmdj-2 → port 9223 (Parallel testing)
profile-qmdj-3 → port 9224 (Parallel testing)
profile-qmdj-4 → port 9225 (Parallel testing)
profile-qmdj-5 → port 9226 (Parallel testing)
profile-qmdj-6 → port 9227 (Parallel testing)
```

## Supported Devices for Emulation
```
- iphone-13
- iphone-13-pro
- iphone-se
- pixel-5
- samsung-s21
- ipad-pro
- ipad-air
```

## Network Throttling Options
```
--offline      No network
--slow-3g      500 Kbps, 2000ms latency
--fast-3g      1.6 Mbps, 560ms latency
(no flags)     No throttling
```

## JSON Output
Most commands support `--json` flag for programmatic use:
```bash
dv network --port 9222 --json
dv cookies --port 9222 --json
dv inspect --port 9222 --selector "#btn" --json
```

## Common Patterns

### API Testing
```bash
dv start --port 9222 --headed
dv navigate --port 9222 --url https://myapp.com
dv network --port 9222 --filter "/api"
dv request --port 9222 --id <id> --body --json
```

### Mobile Testing
```bash
dv start --port 9222 --headed
dv emulate --port 9222 --device iphone-13
dv location --port 9222 --lat 37.7749 --lng -122.4194
dv throttle --port 9222 --slow-3g
dv navigate --port 9222 --url https://myapp.com
```

### Form Testing
```bash
dv fill --port 9222 --selector "#email" --value "test@example.com"
dv fill --port 9222 --selector "#password" --value "secret"
dv click --port 9222 --selector "#submit"
dv console --port 9222 --type error
```

### Performance Testing
```bash
dv clear-cache --port 9222
dv throttle --port 9222 --fast-3g
dv navigate --port 9222 --url https://myapp.com
dv screenshot --port 9222 --output result.png
```
