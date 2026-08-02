# DV CLI Quick Reference

## Total Commands: 50

### Browser Management
```bash
dv1 start
dv1 status
dv1 tabs
dv1 select --url "example"
dv1 close
dv1 stop
```

### Navigation & Execution
```bash
dv1 goto https://example.com
dv1 new https://example.com
dv1 eval --script "document.title"
dv1 eval --file script.js
```

### Element Interaction
```bash
dv1 click #button
dv1 fill #input "text"
dv1 type #input "more"
dv1 key --key Enter
```

### DOM Manipulation
```bash
dv1 inspect --selector "#button"
dv1 query-all --selector ".item"
dv1 query "my-comp >>> .btn" --html
dv1 query "my-comp >>> .title" --text
dv1 query "my-comp >>> input" --attr placeholder
dv1 query ".list-item" --count
dv1 query ".modal" --exists
dv1 get-text --selector "#title"
dv1 get-html --selector "#container"
dv1 set-text --selector "#title" --value "New"
dv1 set-html --selector "#div" --value "<p>HTML</p>"
dv1 set-attribute --selector "#btn" --attr disabled --value "true"
```

### Network Monitoring
```bash
dv1 network
dv1 network --filter "api" --json
dv1 intercept --url "api.example.com" --action block
dv1 request --id <id> --body
dv1 clear-cache
```

### Device Emulation
```bash
dv1 emulate --device iphone-13
dv1 emulate --device pixel-5
dv1 location 37.7749 -122.4194
dv1 user-agent --ua "Mozilla/5.0..."
dv1 timezone --tz "America/New_York"
dv1 throttle --slow-3g
dv1 throttle --offline
```

### Storage Management
```bash
dv1 cookies
dv1 cookies --domain example.com --json
dv1 cookies-clear
dv1 storage-clear --type local
dv1 storage-clear --type session
dv1 storage-clear --type all
dv1 local-storage
dv1 session-storage
```

### Screenshots & Snapshots
```bash
dv1 screenshot page.png
dv1 snapshot --json
```

### Console & Monitoring
```bash
dv1 console
dv1 console --type error
dv1 monitor --types error,warn
```

### Viewport Control
```bash
dv1 resize 1920 1080
```

### Profile Management
```bash
dv profiles
```

## Profiles (Port Assignments)
```
dv1 → port 9230
dv2 → port 9231
dv3 → port 9232
dv4 → port 9233
dv5 → port 9234
dv6 → port 9235
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
dv1 network --json
dv1 cookies --json
dv1 inspect --selector "#btn" --json
```

## Common Patterns

### API Testing
```bash
dv1 start
dv1 goto https://myapp.com
dv1 network --filter "/api"
dv1 request --id <id> --body --json
```

### Mobile Testing
```bash
dv1 start
dv1 emulate --device iphone-13
dv1 location 37.7749 -122.4194
dv1 throttle --slow-3g
dv1 goto https://myapp.com
```

### Form Testing
```bash
dv1 fill #email "test@example.com"
dv1 fill #password "secret"
dv1 click #submit
dv1 console --type error
```

### Performance Testing
```bash
dv1 clear-cache
dv1 throttle --fast-3g
dv1 goto https://myapp.com
dv1 screenshot result.png
```