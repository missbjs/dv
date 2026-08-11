# CDP Methods Coverage

## Package: @missbjs/dv

Chrome DevTools Protocol CLI

## Current Implementation

### Implemented CDP Domains (13/56 = 23.2%)

| Domain | CDP Method | CLI Command | Status |
|--------|-----------|-------------|--------|
| **Browser HTTP API** | | | |
| HTTP | `/json` (list targets) | `tabs`, `status` | ✅ Implemented |
| HTTP | `/json/new?url` | `new` | ✅ Implemented |
| HTTP | `/json/close/id` | `close` | ✅ Implemented |
| **Page** | | | |
| Page | `Page.enable` | Internal | ✅ Implemented |
| Page | `Page.navigate` | `navigate` | ✅ Implemented |
| Page | `Page.captureScreenshot` | `screenshot` | ✅ Implemented |
| Page | `Page.printToPDF` | `pdf` | ✅ Implemented |
| **Runtime** | | | |
| Runtime | `Runtime.enable` | Internal | ✅ Implemented |
| Runtime | `Runtime.evaluate` | `eval` | ✅ Implemented |
| **Console** | | | |
| Console | `Console.enable` | Internal | ✅ Implemented |
| Console | Console events | `console`, `monitor` | ✅ Implemented |
| **Input** | | | |
| Input | `Input.dispatchMouseEvent` | `click`, `dblclick`, `hover`, `drag` | ✅ Implemented |
| Input | `Input.dispatchKeyEvent` | `type`, `fill`, `key` | ✅ Implemented |
| **DOM** | | | |
| DOM | `DOM.getDocument` | Internal | ✅ Implemented |
| DOM | `DOM.querySelector` | Internal | ✅ Implemented |
| DOM | `DOM.querySelectorAll` | `query-all` | ✅ Implemented |
| DOM | `DOM.getBoxModel` | `inspect`, `box` | ✅ Implemented |
| DOM | `DOM.getAttributes` | `inspect`, `attr` | ✅ Implemented |
| DOM | `DOM.getOuterHTML` | `get-html` | ✅ Implemented |
| DOM | `DOM.setOuterHTML` | `set-html` | ✅ Implemented |
| DOM | `DOM.setAttributeValue` | `set-attribute` | ✅ Implemented |
| DOM | `DOM.setNodeValue` | `set-text` | ✅ Implemented |
| DOM | `DOM.markUndoableState` | Internal | ✅ Implemented |
| DOM | `DOM.getNodeForLocation` | `inspect` | ✅ Implemented |
| DOM | `DOM.scrollIntoViewIfNeeded` | `scroll-into-view` | ✅ Implemented |
| DOM | `DOM.getContentQuads` | `box` | ✅ Implemented |
| **DOMSnapshot** | | | |
| DOMSnapshot | `DOMSnapshot.captureSnapshot` | `snapshot` | ✅ Implemented |
| **Network** | | | |
| Network | `Network.enable` | Internal | ✅ Implemented |
| Network | `Network.requestWillBeSent` | `network` | ✅ Implemented |
| Network | `Network.responseReceived` | `network` | ✅ Implemented |
| Network | `Network.getResponseBody` | `request` | ✅ Implemented |
| Network | `Network.setCacheDisabled` | `clear-cache` | ✅ Implemented |
| Network | `Network.clearBrowserCache` | `clear-cache` | ✅ Implemented |
| Network | `Network.setRequestInterception` | `intercept` | ✅ Implemented |
| Network | `Network.continueInterceptedRequest` | `intercept` | ✅ Implemented |
| **Emulation** | | | |
| Emulation | `Emulation.setDeviceMetricsOverride` | `resize`, `emulate` | ✅ Implemented |
| Emulation | `Emulation.setGeolocationOverride` | `location` | ✅ Implemented |
| Emulation | `Emulation.clearGeolocationOverride` | Internal | ✅ Implemented |
| Emulation | `Emulation.setUserAgentOverride` | `user-agent` | ✅ Implemented |
| Emulation | `Emulation.setTimezoneOverride` | `timezone` | ✅ Implemented |
| Emulation | `Emulation.setNetworkConditions` | `throttle` | ✅ Implemented |
| **Storage** | | | |
| Storage | `Storage.getCookies` | `cookies` | ✅ Implemented |
| Storage | `Storage.clearCookies` | `cookies-clear` | ✅ Implemented |
| Storage | `Storage.clearDataForOrigin` | `storage-clear` | ✅ Implemented |
| **DOMStorage** | | | |
| DOMStorage | `DOMStorage.getDOMStorageItems` | `local-storage`, `session-storage` | ✅ Implemented |
| DOMStorage | `DOMStorage.setDOMStorageItem` | Internal | ✅ Implemented |
| DOMStorage | `DOMStorage.removeDOMStorageItem` | Internal | ✅ Implemented |
| **Clipboard** | | | |
| Clipboard | `Clipboard.readText` | `clipboard read` | ✅ Implemented |
| Clipboard | `Clipboard.writeText` | `clipboard write` | ✅ Implemented |

---

## Not Implemented (Lower Priority for CLI)

These CDP domains are not relevant for browser automation/testing CLI:

| Domain | Reason |
|--------|--------|
| **Accessibility** | Covered by `snapshot` command |
| **Animation** | Animation debugging (GUI DevTools) |
| **Audits** | Performance audits (better tools exist) |
| **CSS** | Use `Runtime.evaluate` instead |
| **Debugger** | Breakpoint debugging (GUI DevTools) |
| **DOMDebugger** | DOM breakpoints (GUI DevTools) |
| **HeapProfiler** | Memory profiling (specialized tooling) |
| **IndexedDB** | Use `Runtime.evaluate` instead |
| **LayerTree** | Compositor debugging |
| **Log** | Log streaming (use `monitor`) |
| **Performance** | Metrics (use `eval` for specific metrics) |
| **Profiler** | CPU profiling (specialized tooling) |
| **Security** | Security debugging (GUI DevTools) |
| **Target** | Target management (use HTTP API) |
| **Tracing** | Tracing (specialized tooling) |
| **WebAudio** | Audio debugging |
| **WebAuthn** | Authentication emulation (niche) |

---

## Coverage Summary

| Category | Count |
|----------|-------|
| Implemented domains | 13 |
| Total CDP domains | 56 |
| Coverage percentage | 23.2% |

**Focus**: Browser automation, testing, and debugging use cases.

---

## CLI Commands by Domain

### Browser Management (7)
- `start` - Start Chrome with remote debugging
- `stop` - Stop Chrome process
- `status` - Check Chrome status
- `tabs` - List open tabs
- `select` - Select tab
- `new` - Open new tab
- `close` - Close tab

### Navigation & Execution (4)
- `navigate` - Navigate to URL
- `eval` - Evaluate JavaScript
- `snapshot` - Accessibility snapshot
- `screenshot` - Take screenshot

### Element Interaction (13)
- `click` - Click element
- `dblclick` - Double-click element
- `check` - Check a checkbox / radio
- `uncheck` - Uncheck a checkbox
- `scroll-into-view` - Scroll element into viewport
- `fill` - Fill input (clears existing)
- `type` - Type text (appends)
- `key` - Press key
- `hover` - Hover element
- `focus` - Focus element
- `drag` - Drag element
- `upload` - Upload file
- `find` - Semantic locator

### DOM Manipulation (10)
- `inspect` - Inspect element details
- `query` - Query single element
- `query-all` - Query all matching elements
- `get-text` - Get element text
- `get-html` - Get element HTML
- `set-text` - Set element text
- `set-html` - Set element HTML
- `set-attribute` - Set element attribute
- `highlight` - Highlight element
- `watch` - Watch DOM mutations

### Element State & Box Model (7)
- `is-visible` - Check element visibility
- `is-enabled` - Check element enabled state
- `is-checked` - Check checkbox state
- `value` - Get input value
- `attr` - Get element attribute
- `box` - Get element box model
- `style` - Get computed styles

### Clipboard & PDF (2)
- `clipboard` - Read/write/copy/paste clipboard
- `pdf` - Export page as PDF

### Network Monitoring (5)
- `network` - List network requests
- `intercept` - Block/mock requests
- `request` - Get request details
- `clear-cache` - Clear browser cache
- `har` - Export network activity as HAR


### Device Emulation (5)
- `emulate` - Device emulation
- `location` - Geolocation override
- `user-agent` - User agent override
- `timezone` - Timezone override
- `throttle` - Network throttling

### Storage Management (5)
- `cookies` - List cookies
- `cookies-clear` - Clear cookies
- `storage-clear` - Clear storage
- `local-storage` - List localStorage
- `session-storage` - List sessionStorage

### Console & Monitoring (4)
- `console` - List console messages
- `monitor` - Real-time monitoring
- `perf` - Performance metrics
- `dialog` - Handle dialogs

### Page Control (4)
- `resize` - Resize viewport
- `scroll` - Scroll page
- `frame` - Set/switch frame
- `wait` - Wait for element/network

### Comparison & Batch (2)
- `diff` - Compare snapshots
- `batch` - Run commands sequentially

### Profile Management (1)
- `profiles` - List profiles

**Total: 73 commands**

---

## Architecture

The CLI focuses on **browser automation and testing** with these capabilities:

✅ Browser lifecycle (start, stop, status)
✅ Navigation (navigate, new tab)
✅ JavaScript execution (eval)
✅ Console monitoring (console, monitor)
✅ Element interaction (click, fill, type, key)
✅ Tab management (tabs, select, close)
✅ Viewport control (resize)
✅ Screenshots (screenshot)
✅ Accessibility snapshots (snapshot)
✅ Network monitoring & interception
✅ Enhanced DOM manipulation
✅ Device emulation
✅ Storage management
✅ Profile-based parallel execution

**Architecture Strengths:**
- Simple, focused API
- Profile system for parallel agents (6 profiles: dv1-dv6, ports 9230-9235)
- Mandatory profile argument (command prefix, e.g. `dv1 start`) prevents agent collisions
- JSON output for programmatic use

---

## Recommendations

The current 19.6% domain coverage is appropriate for a CLI automation tool. The implemented domains provide:

1. **Full browser control** - Start, stop, navigate, manage pages
2. **Complete DOM interaction** - Click, fill, type, inspect, modify
3. **Network visibility** - Monitor, intercept, mock requests
4. **Device testing** - Emulate mobile, geolocation, throttling
5. **Storage access** - Cookies, localStorage, sessionStorage

Additional domains would add marginal value for CLI use cases. The focus should remain on:
- Stability and error handling
- Profile management for parallel execution
- Integration with AI agent workflows