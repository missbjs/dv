# Changelog

## @missbjs/dv

### 1.0.0 (2026-07-03)

#### Profile System Refactor
Replaced `--port` parameter with mandatory `--profile` system for all commands.

**Changes:**
- All commands now require `--profile <profile>` instead of `--port <port>`
- Profiles renamed from `profile-qmdj-1` to `profile-1` through `profile-6`
- Port assignments changed: 9230-9235 (instead of 9222-9227)
- `dv profiles` command lists all available profiles

**Profile Table:**
| Profile | Port | Purpose |
|---------|------|---------|
| profile-1 | 9230 | General use |
| profile-2 | 9231 | Parallel testing |
| profile-3 | 9232 | Parallel testing |
| profile-4 | 9233 | Parallel testing |
| profile-5 | 9234 | Parallel testing |
| profile-6 | 9235 | Parallel testing |

**Example:**
```bash
# Old (deprecated)
dv start --port 9222 --headed
dv navigate --port 9222 --url https://example.com

# New (current)
dv start --profile profile-1 --headed
dv navigate --profile profile-1 --url https://example.com
```

---

### 0.9.0 (2026-06-22)

#### Feature Expansion
Added 32 new commands across Network, DOM, Emulation, and Storage domains.

**New Commands:**

Network (4):
- `network` - List/monitor network requests
- `intercept` - Block/mock network requests
- `request` - Get request/response details
- `clear-cache` - Clear browser cache

DOM (7):
- `inspect` - Inspect element details
- `query-all` - Query all matching elements
- `get-text` - Get element text content
- `get-html` - Get element HTML
- `set-text` - Set element text content
- `set-html` - Set element HTML
- `set-attribute` - Set element attribute

Emulation (5):
- `emulate` - Device emulation (iPhone, Pixel, iPad)
- `location` - Geolocation override
- `user-agent` - User agent override
- `timezone` - Timezone override
- `throttle` - Network throttling (offline, 3G)

Storage (5):
- `cookies` - List cookies
- `cookies-clear` - Clear cookies
- `storage-clear` - Clear localStorage/sessionStorage
- `local-storage` - List localStorage items
- `session-storage` - List sessionStorage items

**CDP Coverage:** Increased from 12.5% (7 domains) to 19.6% (11 domains)

---

### 0.2.0 (2026-06-16)

#### Mandatory Port Parameter
Made `--port` parameter mandatory for all CDP commands to prevent AI agent collisions.

**Problem:**
- AI agents used default port 9222 when port was optional
- Multiple agents could accidentally interfere with each other's browser instances

**Solution:**
- Made `--port` required for all commands connecting to Chrome
- Forces explicit port specification

**Commands Updated (15):**
navigate, eval, snapshot, screenshot, console, click, fill, type, key, pages, select, new, close, resize, monitor

---

### 0.1.0 (2026-06-15)

#### Initial Release
Core browser automation commands.

**Commands (17):**
- `start` - Start Chrome with remote debugging
- `status` - Check Chrome status
- `navigate` - Navigate to URL
- `eval` - Evaluate JavaScript
- `snapshot` - Accessibility snapshot
- `screenshot` - Take screenshot
- `console` - List console messages
- `click` - Click element
- `fill` - Fill input
- `type` - Type text
- `key` - Press key
- `pages` - List pages
- `select` - Select page
- `new` - Open new page
- `close` - Close page
- `resize` - Resize viewport
- `monitor` - Real-time console monitoring

**Architecture:**
- TypeScript 5.5
- Node.js ≥18.0.0
- Chrome DevTools Protocol via WebSocket
- Dependencies: ws, axios, commander, chalk