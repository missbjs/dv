# Coding Conventions

**Last Updated:** 2026-06-16
**Analyzer:** gsd-codebase-mapper (quality focus)

## Naming Conventions

**Files:**
- Source files: `camelCase.ts` (e.g., `cdp.ts`, `profiles.ts`)
- Command files: `camelCase.ts` in `src/commands/` directory
- No barrel files (index.ts) observed

**Variables:**
- camelCase for local variables and parameters
- UPPER_SNAKE_CASE for constants (e.g., `SESSION_FILE`, `PROFILES`)

**Functions:**
- camelCase for function names (e.g., `getProfile`, `listProfiles`, `takeSnapshot`)
- Async functions use `async` keyword
- Exported command functions match CLI command names (e.g., `navigate`, `click`, `fill`)

**Classes:**
- PascalCase for class names (e.g., `CDPClient`)
- Private members use `private` keyword with underscore prefix convention (e.g., `private ws`, `private messageId`)

**Interfaces:**
- PascalCase for interface names (e.g., `Profile`, `CDPTarget`, `ConsoleMessage`)
- Options interfaces suffixed with `Options` (e.g., `StartOptions`, `NavigateOptions`, `ClickOptions`)
- Each command file exports its own Options interface

**Constants:**
- UPPER_SNAKE_CASE for module-level constants (e.g., `SESSION_FILE`, `PROFILES`)

## TypeScript Patterns

**Type definitions:**
- Interfaces used for data structures (no `type` aliases observed)
- Located in dedicated `src/types.ts` file for shared types
- Command-specific types defined in their respective command files

**Interfaces:**
- All interfaces use `interface` keyword, not `type`
- Optional properties use `?` suffix (e.g., `port?: number`)
- Index signatures used for config objects (e.g., `[key: string]: Profile`)

**Generics:**
- No generics usage observed in codebase
- Map with typed values: `Map<number, { resolve, reject }>`

**Enums:**
- No enums used; union types with string literals preferred (e.g., `'log' | 'warn' | 'error' | 'info' | 'debug'`)

**Type guards:**
- `error instanceof Error` pattern for error handling
- `axios.isAxiosError(error)` for Axios-specific error checking

## Code Organization

**Imports:**
- Node.js built-ins first (e.g., `import { spawn } from 'child_process'`)
- External packages second (e.g., `import WebSocket from 'ws'`)
- Local imports last with `.js` extension (e.g., `import { CDPClient } from '../cdp.js'`)
- ES module syntax with explicit `.js` extensions for local imports

**Exports:**
- Named exports preferred (e.g., `export async function start()`)
- No default exports used
- Interfaces exported alongside functions

**File structure:**
- Types/interfaces at top of file
- Main function after imports
- Helper functions below main function
- Consistent pattern across all command files

## Error Handling

**Error types:**
- Native `Error` class used
- CDP errors passed through from WebSocket messages

**Error propagation:**
- Try-catch blocks in all async command handlers
- `error instanceof Error` check for safe message access
- `process.exit(1)` on error for CLI commands

**Error messages:**
- User-friendly messages with chalk coloring
- Context-specific guidance (e.g., "Start it first with: dv1 start")
- Suggestion of available options on failure (e.g., listing available profiles)

**Patterns:**
```typescript
try {
  // operation
} catch (error) {
  console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
  process.exit(1);
} finally {
  await client.close();
}
```

## Async Patterns

**Promises:**
- Promise constructor for WebSocket message handling
- `new Promise((resolve, reject) => { ... })` pattern

**Async/await:**
- All command handlers are async functions
- `await` used throughout for async operations
- No callback-based APIs

**Callbacks:**
- Event handlers for WebSocket events (`ws.on('message', ...)`)
- Timeout-based polling in monitor command

## Documentation

**Comments:**
- Minimal inline comments
- Comments explain "why" not "what" (e.g., "// Wait a bit for Chrome to start")
- Section comments for logical groupings

**JSDoc:**
- No JSDoc comments observed
- Function signatures self-documenting with TypeScript types

**README:**
- Package.json description field contains project description
- No README.md analyzed in this scope

## Code Quality

**Linting:**
- No linting configuration detected (no `.eslintrc` or `eslint.config.*`)
- TypeScript strict mode enabled in `tsconfig.json`

**Formatting:**
- No formatter configuration detected (no `.prettierrc`)
- tsup used for building (`tsup src/cli.ts --format esm`)
- Source maps and declaration maps enabled

**TypeScript strictness:**
- `strict: true` enabled
- Target: ES2022
- Module: ESNext with Node module resolution
- `esModuleInterop: true` for CommonJS compatibility

## Best Practices Observed

1. **Consistent command pattern**: All commands follow same structure (load state, connect, operate, handle errors, close)
2. **Resource cleanup**: `finally` blocks ensure WebSocket connections are closed
3. **User feedback**: Progress messages with chalk coloring throughout operations
4. **Type safety**: Interfaces for all options and data structures
5. **State persistence**: Session state saved to `.dv-session.json` for continuity
6. **Platform awareness**: Chrome path detection for Windows, macOS, and Linux
7. **Timeout handling**: 30-second timeout on CDP responses, 5-second timeout on HTTP requests
8. **Error context**: Axios error detection with specific messages for connection refused
9. **Separated concerns**: Types, profiles, CDP client, and commands in separate modules
10. **Commander.js pattern**: Consistent CLI option definitions with `.option()` and `.requiredOption()`

---

*Convention analysis: 2026-06-16*
