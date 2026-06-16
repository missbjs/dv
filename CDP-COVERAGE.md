# CDP Methods Coverage

## Package: @missbjs/dv

Chrome DevTools Protocol CLI

## Current Implementation

### Implemented CDP Methods

| Domain | CDP Method | CLI Command | Status |
|--------|-----------|-------------|---------|
| **Browser** | | | |
| HTTP | `/json` (list targets) | `pages`, `status` | ✅ Implemented |
| HTTP | `/json/new?url` | `new` | ✅ Implemented |
| HTTP | `/json/close/id` | `close` | ✅ Implemented |
| **Page** | | | |
| Page | `Page.enable` | Internal | ✅ Implemented |
| Page | `Page.navigate` | `navigate` | ✅ Implemented |
| Page | `Page.captureScreenshot` | `screenshot` | ✅ Implemented |
| **Runtime** | | | |
| Runtime | `Runtime.enable` | Internal | ✅ Implemented |
| Runtime | `Runtime.evaluate` | `eval` | ✅ Implemented |
| **Console** | | | |
| Console | `Console.enable` | Internal | ✅ Implemented |
| Console | Console events | `console`, `monitor` | ✅ Implemented |
| **DOM** | | | |
| DOM | `DOM.getDocument` | Internal (click) | ✅ Implemented |
| DOM | `DOM.querySelector` | Internal (click) | ✅ Implemented |
| DOM | `DOM.getBoxModel` | Internal (click) | ✅ Implemented |
| **DOMSnapshot** | | | |
| DOMSnapshot | `DOMSnapshot.captureSnapshot` | `snapshot` | ✅ Implemented |
| **Input** | | | |
| Input | `Input.dispatchMouseEvent` | `click` | ✅ Implemented |
| Input | `Input.dispatchKeyEvent` | `type`, `fill`, `key` | ✅ Implemented |
| **Emulation** | | | |
| Emulation | `Emulation.setDeviceMetricsOverride` | `resize` | ✅ Implemented |

**Coverage: 7/56 domains (12.5%)** - Focus on browser automation and testing

---

## Missing High-Value CDP Features

### Network Domain (HIGH PRIORITY)
Monitor and intercept network requests - critical for testing and debugging.

**Missing Commands:**
```bash
# Network monitoring
dv network --port 9222 [--filter pattern] [--json]

# Network interception
dv intercept --port 9222 --url pattern --action block|modify|mock

# Request/Response details
dv request --port 9222 --id <request-id>
dv response --port 9222 --id <request-id>

# Clear network cache
dv clear-cache --port 9222
```

**CDP Methods:**
- `Network.enable` - Enable network events
- `Network.requestWillBeSent` - Track requests
- `Network.responseReceived` - Track responses
- `Network.getResponseBody` - Get response body
- `Network.setCacheDisabled` - Disable cache
- `Network.setRequestInterception` - Intercept requests

### DOM Domain (MEDIUM PRIORITY)
More DOM interaction beyond basic click/fill.

**Missing Commands:**
```bash
# DOM inspection
dv inspect --port 9222 --selector <css> [--json]

# DOM modification
dv set-text --port 9222 --selector <css> --value <text>
dv set-html --port 9222 --selector <css> --value <html>
dv set-attribute --port 9222 --selector <css> --attr <name> --value <value>

# DOM queries
dv query-all --port 9222 --selector <css> [--json]
dv get-text --port 9222 --selector <css>
dv get-html --port 9222 --selector <css>
```

**CDP Methods:**
- `DOM.setNodeValue` - Set text content
- `DOM.setOuterHTML` - Set HTML
- `DOM.setAttributeValue` - Set attributes
- `DOM.querySelectorAll` - Query multiple elements
- `DOM.getOuterHTML` - Get HTML
- `DOM.getAttributes` - Get all attributes

### Emulation Domain (MEDIUM PRIORITY)
Device and environment emulation for testing.

**Missing Commands:**
```bash
# Device emulation
dv emulate --port 9222 --device "iPhone 13"

# Geolocation
dv location --port 9222 --lat 37.7749 --lng -122.4194

# User agent
dv user-agent --port 9222 --ua "Mozilla/5.0..."

# Timezone
dv timezone --port 9222 --tz "America/New_York"

# Network conditions
dv throttle --port 9222 --offline | --slow-3g | --fast-3g
```

**CDP Methods:**
- `Emulation.setDeviceMetricsOverride` - Device emulation
- `Emulation.setGeolocationOverride` - Geolocation
- `Emulation.setUserAgentOverride` - User agent
- `Emulation.setTimezoneOverride` - Timezone
- `Emulation.setNetworkConditions` - Network throttling

### Debugger Domain (LOW PRIORITY)
JavaScript debugging with breakpoints.

**Missing Commands:**
```bash
# Breakpoints
dv break --port 9222 --file script.js --line 42
dv break-remove --port 9222 --id <breakpoint-id>

# Step debugging
dv step-over --port 9222
dv step-into --port 9222
dv step-out --port 9222
dv resume --port 9222

# Call stack
dv stack --port 9222 [--json]
```

**CDP Methods:**
- `Debugger.enable` - Enable debugger
- `Debugger.setBreakpoint` - Set breakpoints
- `Debugger.stepOver/stepInto/stepOut` - Step debugging
- `Debugger.resume` - Continue execution
- `Debugger.pause` - Pause execution

### Performance Domain (LOW PRIORITY)
Performance metrics and profiling.

**Missing Commands:**
```bash
# Performance metrics
dv metrics --port 9222 [--json]

# Tracing
dv trace-start --port 9222 --categories "devtools.timeline"
dv trace-stop --port 9222 --output trace.json
```

**CDP Methods:**
- `Performance.getMetrics` - Get performance metrics
- `Performance.enable` - Enable performance monitoring
- `Tracing.start` - Start tracing
- `Tracing.end` - Stop tracing

### Storage Domain (LOW PRIORITY)
Manage browser storage.

**Missing Commands:**
```bash
# Storage management
dv cookies --port 9222 [--json]
dv cookies-clear --port 9222 [--domain example.com]
dv storage-clear --port 9222 --type local|session|all
```

**CDP Methods:**
- `Storage.getCookies` - Get cookies
- `Storage.clearCookies` - Clear cookies
- `Storage.clearDataForOrigin` - Clear storage

---

## Not Applicable to CLI Use Case

These CDP domains are not relevant for browser automation/testing:

- **Accessibility** - Accessibility tree inspection (covered by snapshot)
- **Animation** - Animation debugging
- **Audits** - Performance audits (better tools exist)
- **CSS** - CSS manipulation (use Runtime.evaluate instead)
- **DOMDebugger** - DOM breakpoints
- **HeapProfiler** - Memory profiling (specialized tooling)
- **IndexedDB** - Database inspection (use Runtime.evaluate)
- **LayerTree** - Compositor debugging
- **Profiler** - CPU profiling (specialized tooling)
- **WebAudio** - Audio debugging
- **WebAuthn** - Authentication emulation (niche)

---

## Priority Implementation Order

### Phase 1: Essential (Network Monitoring)
1. `network` - List/monitor network requests
2. `intercept` - Block/mock network requests
3. `clear-cache` - Clear browser cache

**Why:** Network monitoring is critical for testing API interactions, debugging failures, and verifying requests.

### Phase 2: Useful (DOM & Emulation)
4. `inspect` - Inspect element details
5. `set-text`, `set-html`, `set-attribute` - Direct DOM manipulation
6. `query-all` - Query multiple elements
7. `emulate` - Device emulation
8. `location` - Geolocation override
9. `throttle` - Network throttling

**Why:** Enhanced DOM manipulation and device emulation enable comprehensive testing scenarios.

### Phase 3: Advanced (Debugging & Performance)
10. `break`, `step-*`, `resume` - JavaScript debugging
11. `stack` - Call stack inspection
12. `metrics` - Performance metrics
13. `cookies`, `storage-clear` - Storage management

**Why:** Advanced debugging capabilities for complex scenarios, but lower priority than automation features.

---

## Current Architecture

The CLI currently focuses on **browser automation and testing** with these capabilities:

✅ Browser lifecycle (start, status, close)
✅ Navigation (navigate, new page)
✅ JavaScript execution (eval)
✅ Console monitoring (console, monitor)
✅ Element interaction (click, fill, type, key)
✅ Page management (pages, select, close)
✅ Viewport control (resize)
✅ Screenshots (screenshot)
✅ Accessibility snapshots (snapshot)

**Architecture Strengths:**
- Simple, focused API
- Good coverage for automation workflows
- Profile management for parallel agents
- State persistence

**Architecture Gaps:**
- No network visibility (can't debug API calls)
- Limited DOM manipulation (can only click/fill/type)
- No device emulation (can't test mobile)
- No request interception (can't mock responses)

---

## Recommendations

1. **Implement Network Domain** - Highest ROI for testing/debugging
2. **Enhance DOM Domain** - More flexible element manipulation
3. **Add Emulation Domain** - Mobile/device testing capabilities
4. **Keep Architecture Simple** - Don't try to wrap all 56 domains
5. **Focus on CLI Use Cases** - Skip domains better suited for GUI DevTools

The current 12.5% domain coverage is appropriate for a CLI automation tool. Expanding to ~20% coverage (adding Network + Emulation + enhanced DOM) would provide 90% of the value for CLI workflows.
