<!-- refreshed: 2026-06-16 -->
# Architecture

**Analysis Date:** 2026-06-16

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                        CLI Layer                             │
│                     `src/cli.ts`                             │
│              Commander.js argument parsing                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     Command Layer                            │
│                   `src/commands/`                            │
├──────────────────┬──────────────────┬───────────────────────┤
│  Browser Ctrl    │   Page Actions   │   Inspection          │
│  `start.ts`      │  `click.ts`      │  `snapshot.ts`        │
│  `new.ts`        │  `fill.ts`       │  `screenshot.ts`      │
│  `close.ts`      │  `type.ts`       │  `eval.ts`            │
│  `resize.ts`     │  `key.ts`        │  `console.ts`         │
│  `pages.ts`      │  `select.ts`     │  `monitor.ts`         │
│                  │  `navigate.ts`   │                       │
└──────────────────┴──────────────────┴───────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    CDP Client Layer                          │
│                     `src/cdp.ts`                             │
│            WebSocket + HTTP communication                    │
│            Message routing, state management                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 Chrome DevTools Protocol                     │
│              Remote Debugging Port (9222-9227)               │
│              WebSocket + HTTP REST API                       │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| CLI Entry | Parse CLI arguments, register commands | `src/cli.ts` |
| CDPClient | WebSocket connection, message routing, state management | `src/cdp.ts` |
| Types | TypeScript interfaces for CDP messages, profiles, session | `src/types.ts` |
| Profiles | Profile configuration (6 predefined Chrome profiles) | `src/profiles.ts` |
| start | Start Chrome with remote debugging enabled | `src/commands/start.ts` |
| navigate | Navigate to URL in current page | `src/commands/navigate.ts` |
| eval | Execute JavaScript in page context | `src/commands/eval.ts` |
| snapshot | Capture accessibility tree snapshot | `src/commands/snapshot.ts` |
| screenshot | Capture page screenshot | `src/commands/screenshot.ts` |
| console | List/filter console messages | `src/commands/console.ts` |
| click | Click element by CSS selector | `src/commands/click.ts` |
| fill | Clear and fill input with value | `src/commands/fill.ts` |
| type | Type text into element (append) | `src/commands/type.ts` |
| key | Press a key (Enter, Escape, etc.) | `src/commands/key.ts` |
| pages | List all open pages | `src/commands/pages.ts` |
| select | Select page by URL, ID, or index | `src/commands/select.ts` |
| new | Open new page with URL | `src/commands/new.ts` |
| close | Close current or specified page | `src/commands/close.ts` |
| resize | Resize viewport dimensions | `src/commands/resize.ts` |
| monitor | Real-time console message monitoring | `src/commands/monitor.ts` |

## Pattern Overview

**Overall:** Command Pattern with Client-Server Architecture

**Key Characteristics:**
- Single executable CLI tool with 18 commands
- Stateful session management via `.dv-session.json`
- WebSocket-based bidirectional communication with Chrome
- Each command creates a fresh CDPClient instance
- Commands are independent and idempotent

## Layers

**CLI Layer:**
- Purpose: Parse command-line arguments and dispatch to command handlers
- Location: `src/cli.ts`
- Contains: Commander.js program definition, command registration
- Depends on: Commander.js, all command modules
- Used by: Node.js runtime (entry point)

**Command Layer:**
- Purpose: Implement specific CLI commands with business logic
- Location: `src/commands/` (16 files)
- Contains: One exported async function per command, options interfaces
- Depends on: CDPClient, chalk, fs
- Used by: CLI layer

**CDP Client Layer:**
- Purpose: Abstract Chrome DevTools Protocol communication
- Location: `src/cdp.ts`
- Contains: WebSocket management, message correlation, CDP method wrappers
- Depends on: ws, axios, types
- Used by: Command layer

**Data Layer:**
- Purpose: Type definitions and configuration
- Location: `src/types.ts`, `src/profiles.ts`
- Contains: TypeScript interfaces, profile configuration
- Depends on: None
- Used by: All layers

## Data Flow

### Primary Request Path (e.g., dv click)

1. CLI parses arguments (`src/cli.ts:105-108`)
2. Command handler invoked with options (`src/commands/click.ts:8`)
3. CDPClient created with default port 9222 (`src/commands/click.ts:9`)
4. Load session state from `.dv-session.json` (`src/cdp.ts:31-39`)
5. Connect to page via WebSocket (`src/cdp.ts:76-126`)
6. Send CDP commands and await response (`src/cdp.ts:128-148`)
7. Display result via chalk (`src/commands/click.ts:18`)
8. Close WebSocket connection (`src/cdp.ts:299-304`)

### Session State Flow

1. Load state from `.dv-session.json` on command start
2. State contains: `currentPageId`, `currentProfile`, `port`
3. Use `currentPageId` to reconnect to last used page
4. Save state when page selection changes (`src/commands/select.ts:36`, `src/commands/new.ts:17`)

**State Management:**
- File-based persistence via `.dv-session.json`
- State includes: current page ID, profile name, port number
- Each command loads/saves state independently
- No in-memory state between commands (stateless architecture)

## Key Abstractions

**CDPClient Class:**
- Purpose: Encapsulate all Chrome DevTools Protocol interactions
- Examples: `src/cdp.ts`
- Pattern: Facade pattern - provides simple API over complex WebSocket messaging
- Key methods: `connect()`, `send()`, `evaluate()`, `click()`, `navigate()`

**Command Functions:**
- Purpose: Encapsulate single CLI command logic
- Examples: `src/commands/*.ts`
- Pattern: Command pattern - each command is a standalone async function
- Interface: Options object parameter, returns Promise<void>

**Profile System:**
- Purpose: Predefined Chrome configurations for parallel testing
- Examples: `src/profiles.ts`
- Pattern: Configuration object - 6 profiles with unique ports

## Entry Points

**Primary Entry Point:**
- Location: `src/cli.ts`
- Triggers: CLI invocation via `dv` command
- Responsibilities: Parse arguments, route to command handler

**Build Entry Point:**
- Location: `src/cli.ts` (compiled to `dist/cli.js`)
- Triggers: npm run build (tsup bundler)
- Responsibilities: ESM bundle generation

**Package Binary:**
- Location: `dist/cli.js` (declared in package.json bin field)
- Triggers: `dv` command after npm link/install -g
- Responsibilities: Node.js execution with shebang

## Architectural Constraints

- **Threading:** Single-threaded event loop (Node.js). All I/O is async/await. No worker threads.
- **Global state:** No global mutable state. Session state persisted to `.dv-session.json` file.
- **Circular imports:** No circular dependencies. Clean dependency graph: CLI → Commands → CDPClient → Types.
- **Connection lifecycle:** Each command creates fresh WebSocket connection, closes on completion.
- **Port management:** Default port 9222 hardcoded in commands. Profile system provides alternative ports.
- **Error handling:** Commands catch errors, log with chalk.red, exit with code 1.
- **Timeout:** 30-second timeout for all CDP message responses (`src/cdp.ts:140-146`).

## Anti-Patterns

### Hardcoded Port in Commands

**What happens:** All commands instantiate `CDPClient(9222)` instead of using state port.
**Why it's wrong:** Profile system supports ports 9222-9227, but commands always use 9222.
**Do this instead:** Load state first and use `state.port` or pass port via CLI option.

```typescript
// Current (src/commands/click.ts:9)
const client = new CDPClient(9222);

// Better
const client = new CDPClient(state?.port || 9222);
```

### No Connection Pooling

**What happens:** Each command creates new WebSocket connection, then closes it.
**Why it's wrong:** Connection overhead for rapid command sequences. Could reuse connection.
**Do this instead:** For interactive mode, maintain persistent connection. Current design is fine for one-shot commands.

### Inconsistent Error Messages

**What happens:** Some commands use `console.error(chalk.red(...))` and `process.exit(1)`, others throw.
**Why it's wrong:** Mixed error handling patterns make behavior unpredictable.
**Do this instead:** Centralize error handling in CLI layer with error middleware.

## Error Handling

**Strategy:** Fail-fast with user-friendly error messages.

**Patterns:**
- Try-catch in every command handler
- Chalk for colored error output
- `process.exit(1)` on error
- Specific error for connection refused (`src/cdp.ts:52-54`)
- Timeout errors for unresponsive CDP (`src/cdp.ts:141-145`)
- Element not found errors for selectors (`src/cdp.ts:202-204`)

**Error Types:**
- Connection errors: Chrome not running, port unavailable
- Protocol errors: Element not found, invalid selector
- Timeout errors: CDP response timeout
- Input errors: Missing required options

## Cross-Cutting Concerns

**Logging:** Console output with chalk colors. Blue for info, green for success, red for errors, gray for details. No logging framework.

**Validation:** Commander.js validates required options. Commands validate option combinations (e.g., `--script` vs `--file` in eval).

**Authentication:** None. Chrome DevTools Protocol has no authentication. Port-based security (localhost only).

**Configuration:**
- Profile system in `src/profiles.ts`
- Session state in `.dv-session.json`
- Chrome executable path detection in `src/commands/start.ts:46-54`

## Extension Points

**Add New Command:**
1. Create file in `src/commands/newcommand.ts`
2. Export async function with Options interface
3. Import and register in `src/cli.ts`
4. Add to Commander program with options

**Add New Profile:**
1. Edit `src/profiles.ts`
2. Add entry to PROFILES object with port and purpose

**Add New CDP Method:**
1. Add wrapper method to CDPClient class in `src/cdp.ts`
2. Call `this.send(method, params)` with appropriate parameters

**Add New Type:**
1. Add interface to `src/types.ts`
2. Import and use in commands or CDPClient

---

*Architecture analysis: 2026-06-16*
