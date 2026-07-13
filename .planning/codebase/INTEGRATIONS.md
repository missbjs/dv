# External Integrations

**Analysis Date:** 2026-06-16

## APIs & External Services

**Chrome DevTools Protocol (CDP):**
- Protocol: WebSocket-based debugging protocol
- Purpose: Browser automation, inspection, and control
- Connection: WebSocket to `ws://localhost:{port}/devtools/page/{id}`
- HTTP Endpoints: `http://localhost:{port}/json/*` for target discovery

## Data Storage

**Databases:**
- None - No database integration

**File Storage:**
- Local filesystem only
- Session state: `.dv-session.json` (stores current page ID and profile)
- Chrome profiles: `./profile-qmdj-{1-6}/` directories for user data

**Caching:**
- None - No caching layer

## Authentication & Identity

**Auth Provider:**
- None - CLI tool, no authentication

**Chrome Profiles:**
- 6 predefined profiles for session isolation
- Profile purposes: general use, parallel testing
- All profiles support persistent OAuth sessions
- Managed via `--user-data-dir` Chrome flag

## Monitoring & Observability

**Error Tracking:**
- None - Errors output to console via chalk coloring

**Logs:**
- Console output with colored messages via chalk
- Real-time console monitoring via `dv monitor` command

## CI/CD & Deployment

**Hosting:**
- N/A - CLI tool installed via npm

**CI Pipeline:**
- None detected - No CI configuration files

**Distribution:**
- npm package: `@anthropic/dv-cli`
- Binary: `dv` CLI command

## Environment Configuration

**Required env vars:**
- None - Configuration via CLI flags

**Secrets location:**
- None - No secrets management

## Webhooks & Callbacks

**Incoming:**
- None - CLI tool, no webhook receivers

**Outgoing:**
- WebSocket messages to Chrome DevTools Protocol
- HTTP requests to Chrome debugging port

## Browser Integration

**Protocol:** Chrome DevTools Protocol (CDP)

**WebSocket:**
- Library: ws 8.18.0
- Connection: Direct WebSocket to Chrome's debugger URL
- Pattern: Request/response with message ID correlation

**HTTP Client:**
- Library: axios 1.7.0
- Endpoints used:
  - `GET /json` - List all targets
  - `PUT /json/new?url` - Create new page
  - `GET /json/close/{id}` - Close page

**Browser Automation Capabilities:**
- Navigation: Page navigation with wait for load
- Evaluation: JavaScript execution in page context
- Interaction: Click, fill, type, key press
- Inspection: Console messages, accessibility snapshot, screenshot
- Page Management: List, select, create, close pages
- Viewport: Resize, device emulation

## Communication Protocols

**Chrome DevTools Protocol:**
- WebSocket: Bidirectional message-based protocol
- Message format: JSON with id, method, params, result, error
- Domains used:
  - Runtime: JavaScript evaluation, console
  - Page: Navigation, screenshots
  - DOM: Element queries, box model
  - Input: Mouse and keyboard events
  - Emulation: Device metrics
  - Console: Message tracking
  - DOMSnapshot: Accessibility tree

**HTTP:**
- Used for target discovery and page management
- Chrome's debugging port HTTP API

## Integration Patterns

**CDPClient Class (`src/cdp.ts`):**
- Central integration point for all Chrome interactions
- Manages WebSocket lifecycle
- Correlates request/response via message ID map
- Buffers console messages for retrieval
- Persists session state to filesystem

**Command Pattern:**
- Each CLI command creates CDPClient instance
- Connects to current or specified page
- Executes CDP methods
- Closes connection on completion

**Chrome Process Management:**
- Spawned as detached child process
- Platform-specific executable path detection
- Headless mode via `--headless=new` flag
- Profile isolation via `--user-data-dir`

## Authentication/Security

**Chrome Security:**
- Remote debugging port bound to localhost
- No remote access by default
- Profile directories for session isolation

**No External Auth:**
- Tool operates locally
- No API keys or tokens required
- No network calls beyond localhost Chrome connection

---

*Integration audit: 2026-06-16*
