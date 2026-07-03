# DV CLI Quick Reference

## Total Commands: 49

### Browser Management
```bash
dv start --profile profile-1 --headed
dv status --profile profile-1
dv pages --profile profile-1
dv select --profile profile-1 --url "example"
dv close --profile profile-1
dv stop --profile profile-1
```

### Navigation & Execution
```bash
dv navigate --profile profile-1 --url https://example.com
dv new --profile profile-1 --url https://example.com
dv eval --profile profile-1 --script "document.title"
dv eval --profile profile-1 --file script.js
```

### Element Interaction
```bash
dv click --profile profile-1 --selector "#button"
dv fill --profile profile-1 --selector "#input" --value "text"
dv type --profile profile-1 --selector "#input" --text "more"
dv key --profile profile-1 --key Enter
```

### DOM Manipulation
```bash
dv inspect --profile profile-1 --selector "#button"
dv query-all --profile profile-1 --selector ".item"
dv get-text --profile profile-1 --selector "#title"
dv get-html --profile profile-1 --selector "#container"
dv set-text --profile profile-1 --selector "#title" --value "New"
dv set-html --profile profile-1 --selector "#div" --value "<p>HTML</p>"
dv set-attribute --profile profile-1 --selector "#btn" --attr disabled --value "true"
```

### Network Monitoring
```bash
dv network --profile profile-1
dv network --profile profile-1 --filter "api" --json
dv intercept --profile profile-1 --url "api.example.com" --action block
dv request --profile profile-1 --id <id> --body
dv clear-cache --profile profile-1
```

### Device Emulation
```bash
dv emulate --profile profile-1 --device iphone-13
dv emulate --profile profile-1 --device pixel-5
dv location --profile profile-1 --lat 37.7749 --lng -122.4194
dv user-agent --profile profile-1 --ua "Mozilla/5.0..."
dv timezone --profile profile-1 --tz "America/New_York"
dv throttle --profile profile-1 --slow-3g
dv throttle --profile profile-1 --offline
```

### Storage Management
```bash
dv cookies --profile profile-1
dv cookies --profile profile-1 --domain example.com --json
dv cookies-clear --profile profile-1
dv storage-clear --profile profile-1 --type local
dv storage-clear --profile profile-1 --type session
dv storage-clear --profile profile-1 --type all
dv local-storage --profile profile-1
dv session-storage --profile profile-1
```

### Screenshots & Snapshots
```bash
dv screenshot --profile profile-1 --output page.png
dv snapshot --profile profile-1 --json
```

### Console & Monitoring
```bash
dv console --profile profile-1
dv console --profile profile-1 --type error
dv monitor --profile profile-1 --types error,warn
```

### Viewport Control
```bash
dv resize --profile profile-1 --width 1920 --height 1080
```

### Profile Management
```bash
dv profiles
```

## Profiles (Port Assignments)
```
profile-1 → port 9230 (General use)
profile-2 → port 9231 (Parallel testing)
profile-3 → port 9232 (Parallel testing)
profile-4 → port 9233 (Parallel testing)
profile-5 → port 9234 (Parallel testing)
profile-6 → port 9235 (Parallel testing)
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
dv network --profile profile-1 --json
dv cookies --profile profile-1 --json
dv inspect --profile profile-1 --selector "#btn" --json
```

## Common Patterns

### API Testing
```bash
dv start --profile profile-1 --headed
dv navigate --profile profile-1 --url https://myapp.com
dv network --profile profile-1 --filter "/api"
dv request --profile profile-1 --id <id> --body --json
```

### Mobile Testing
```bash
dv start --profile profile-1 --headed
dv emulate --profile profile-1 --device iphone-13
dv location --profile profile-1 --lat 37.7749 --lng -122.4194
dv throttle --profile profile-1 --slow-3g
dv navigate --profile profile-1 --url https://myapp.com
```

### Form Testing
```bash
dv fill --profile profile-1 --selector "#email" --value "test@example.com"
dv fill --profile profile-1 --selector "#password" --value "secret"
dv click --profile profile-1 --selector "#submit"
dv console --profile profile-1 --type error
```

### Performance Testing
```bash
dv clear-cache --profile profile-1
dv throttle --profile profile-1 --fast-3g
dv navigate --profile profile-1 --url https://myapp.com
dv screenshot --profile profile-1 --output result.png
```
