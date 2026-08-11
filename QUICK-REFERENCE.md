# DV CLI Quick Reference

## Total Commands: 73

### Browser Management
```bash
dv1 start
dv1 status
dv1 tabs
dv1 select --tab <id>
dv1 select --url "example"
dv1 close <tab>
dv1 stop
```

### Navigation & Execution
```bash
dv1 goto https://example.com
dv1 new https://example.com
dv1 reload
dv1 history --back
dv1 history --forward
dv1 eval --script "document.title"
dv1 eval --file script.js
dv1 read --text                # page body text
dv1 read --snapshot            # accessibility tree
dv1 read --html                # full document HTML
dv1 read --dom                 # alias for --html
dv1 read --html "app >>> .card"  # outerHTML of one element (>>> ok)
dv1 read --url https://x.com   # HTTP fetch (no page)
```

### Element Interaction
```bash
dv1 click #button
dv1 dblclick #button
dv1 check #agree
dv1 uncheck #agree
dv1 scroll-into-view #footer
dv1 fill #input "text"
dv1 type #input "more"
dv1 key --key Enter
dv1 hover #menu
dv1 focus #input
dv1 drag --source "#a" --target "#b"
dv1 drag --source "#a" --target "x=100,y=200"
dv1 upload --selector "input[type=file]" --files ./photo.png
dv1 find --mode text --value "Submit" --action click   # semantic locator

# Shadow DOM: >>> works on interaction commands too
dv1 click "my-comp >>> .inner-btn"
dv1 hover "my-menu >>> .item"
dv1 focus "x-input >>> input"
dv1 drag --source "board >>> .card" --target "board >>> .column"
dv1 upload --selector "uploader >>> input[type=file]" --files ./photo.png
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
dv1 query "my-comp >>> sy-a" --style --json
dv1 query "my-comp >>> sy-a" --style --props color,font-size
dv1 get-text --selector "#title"
dv1 get-text --selector "app >>> .title"   # >>> shadow piercing supported
dv1 get-html --selector "#container"
dv1 get-html --selector "app >>> .inner" --json
dv1 value --selector "#email"
dv1 attr --selector "#btn" href
dv1 box --selector "#card" --json
dv1 style --selector "#btn" --props color,display
dv1 set-text --selector "#title" --value "New"
dv1 set-html --selector "#div" --value "<p>HTML</p>"
dv1 set-attribute --selector "#btn" --attr disabled --value "true"
dv1 highlight --selector "#btn"
dv1 watch                       # watch DOM mutations in real-time
```

### Network Monitoring
```bash
dv1 network
dv1 network --filter "api" --json
dv1 intercept --url "api.example.com" --action block
dv1 request --id <id> --body
dv1 clear-cache
dv1 har session.har            # export network activity as HAR
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

### Element State & Box Model
```bash
dv1 is-visible --selector "#modal"
dv1 is-enabled --selector "#submit"
dv1 is-checked --selector "#agree"
dv1 value --selector "#email"
dv1 attr --selector "#btn" href
dv1 box --selector "#card" --json
dv1 style --selector "#btn" --props color,display
```

### Clipboard & PDF
```bash
dv1 clipboard read
dv1 clipboard write "Hello"
dv1 clipboard copy --selector "#content"
dv1 clipboard paste --selector "#input"
dv1 pdf --output page.pdf
dv1 pdf --landscape
dv1 pdf --paper-width 8.5 --paper-height 11 --margin-top 0.5
```

### Console & Diagnostics
```bash
dv1 console
dv1 console --type error
dv1 monitor --types error,warn
dv1 perf                        # performance metrics
dv1 dialog --accept             # handle alert/confirm/prompt
dv1 dialog --dismiss
dv1 dialog --text "input"       # answer a prompt()
```

### Page Control
```bash
dv1 resize 1920 1080
dv1 scroll -y 500               # scroll window down 500px
dv1 scroll --selector "#panel" -y 200
dv1 frame --selector "iframe#checkout"
dv1 frame --list
dv1 wait --selector "#done"     # wait for element
dv1 wait --selector "my-dialog >>> .ready"   # shadow-pierce supported
dv1 wait --networkidle
dv1 wait --ms 1000
```

### Comparison & Batch
```bash
dv1 snapshot --json > before.json
dv1 diff --compare before.json           # current page vs saved snapshot
dv1 diff --files before.json after.json  # two saved snapshots
dv1 batch "navigate https://x.com" "snapshot"   # run commands sequentially
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

## Structured Output (`--json` / `--yaml`)
Every data-returning command supports both `--json` and `--yaml` (human-readable is the default):
```bash
dv1 network --json
dv1 cookies --yaml
dv1 inspect --selector "#btn" --json
dv1 snapshot --yaml
dv1 query "app >>> .price" --text --yaml
dv1 status --json
dv1 clipboard read --json
dv1 is-visible --selector "#modal" --json
dv1 box --selector "#card" --yaml
```
Covered: status, snapshot, network, cookies, console, eval, local-storage,
session-storage, tabs, new, request, query, query-all, inspect, get-text,
get-html, read, find, diff, history --list, frame --list, a11y, perf, profiles,
is-visible, is-enabled, is-checked, value, attr, box, style.

Action commands (click, fill, type, hover, drag, upload, navigate, …) report a
status line and do not take --json/--yaml. `har` is JSON-only (writes a HAR file).

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