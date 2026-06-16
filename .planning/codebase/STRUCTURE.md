# Codebase Structure

**Analysis Date:** 2026-06-16

## Directory Layout

```
dv-cli/
├── src/                    # Source code (TypeScript)
│   ├── commands/           # CLI command implementations (16 files)
│   ├── cli.ts              # CLI entry point
│   ├── cdp.ts              # Chrome DevTools Protocol client
│   ├── types.ts            # TypeScript interfaces
│   └── profiles.ts         # Profile configuration
├── dist/                   # Build output (ESM bundle)
├── node_modules/           # Dependencies
├── package.json            # Package manifest
├── tsconfig.json           # TypeScript configuration
├── package-lock.json       # Dependency lockfile
├── README.md               # User documentation
├── EXAMPLES.md             # Usage examples
├── PROJECT_SUMMARY.md      # Project overview
├── QUICK_REFERENCE.md      # Command reference
├── REVIEW.md               # Code review notes
├── .gitignore              # Git ignore rules
├── .npmignore              # npm publish ignore rules
├── .dv-session.json        # Runtime session state
├── test-*.sh               # Test scripts (bash)
├── test-*.ps1              # Test scripts (PowerShell)
└── test-*.js               # Test scripts (JavaScript)
```

## Directory Purposes

**src/**
- Purpose: All TypeScript source code
- Contains: CLI, commands, CDP client, types, configuration
- Key files: `cli.ts` (entry), `cdp.ts` (core client)

**src/commands/**
- Purpose: Individual CLI command implementations
- Contains: 16 TypeScript files, one per command
- Key files: `start.ts` (browser launch), `navigate.ts` (navigation), `click.ts` (interaction)

**dist/**
- Purpose: Compiled JavaScript output
- Contains: ESM bundle (`cli.js`)
- Generated: Yes (by tsup)
- Committed: Yes (for npm distribution)

**node_modules/**
- Purpose: npm dependencies
- Contains: Runtime and dev dependencies
- Generated: Yes (by npm install)
- Committed: No (in .gitignore)

## Key File Locations

**Entry Points:**
- `src/cli.ts`: CLI entry point, Commander.js setup
- `dist/cli.js`: Compiled bundle (declared in package.json bin)

**Core Logic:**
- `src/cdp.ts`: CDPClient class, WebSocket/HTTP communication
- `src/types.ts`: TypeScript interfaces (CDPMessage, CDPTarget, SessionState, etc.)
- `src/profiles.ts`: Profile configuration (6 Chrome profiles)

**Command Implementations:**
- `src/commands/start.ts`: Start Chrome with debugging
- `src/commands/navigate.ts`: Navigate to URL
- `src/commands/eval.ts`: Execute JavaScript
- `src/commands/snapshot.ts`: Accessibility tree snapshot
- `src/commands/screenshot.ts`: Capture screenshot
- `src/commands/console.ts`: List console messages
- `src/commands/click.ts`: Click element
- `src/commands/fill.ts`: Fill input
- `src/commands/type.ts`: Type text
- `src/commands/key.ts`: Press key
- `src/commands/pages.ts`: List pages
- `src/commands/select.ts`: Select page
- `src/commands/new.ts`: Create new page
- `src/commands/close.ts`: Close page
- `src/commands/resize.ts`: Resize viewport
- `src/commands/monitor.ts`: Monitor console

**Configuration:**
- `package.json`: npm package manifest
- `tsconfig.json`: TypeScript compiler options
- `.gitignore`: Git ignore rules
- `.npmignore`: npm publish exclusion

**Documentation:**
- `README.md`: User-facing documentation
- `EXAMPLES.md`: Usage examples
- `PROJECT_SUMMARY.md`: Project overview
- `QUICK_REFERENCE.md`: Quick command reference
- `REVIEW.md`: Code review notes

**Testing:**
- `test-complete.sh`: Bash test script
- `test-workflow.sh`: Bash workflow test
- `test-workflow.ps1`: PowerShell workflow test
- `test-script.js`: JavaScript test script

**Runtime State:**
- `.dv-session.json`: Session state (currentPageId, profile, port)

## Naming Conventions

**Files:**
- Source files: lowercase with `.ts` extension (`cli.ts`, `cdp.ts`, `types.ts`)
- Command files: lowercase, one word (`click.ts`, `fill.ts`, `navigate.ts`)
- Config files: lowercase with dot prefix (`.gitignore`, `.npmignore`)
- Test files: `test-*.sh`, `test-*.ps1`, `test-*.js`

**Directories:**
- Lowercase, singular nouns (`src`, `dist`, `commands`)

**TypeScript:**
- Interfaces: PascalCase (`CDPClient`, `CDPTarget`, `SessionState`)
- Functions: camelCase (`navigate`, `evalCommand`, `takeScreenshot`)
- Constants: SCREAMING_SNAKE_CASE (`SESSION_FILE`, `PROFILES`)
- Private members: camelCase with no prefix

## Where to Add New Code

**New CLI Command:**
1. Create `src/commands/newcommand.ts`
2. Export async function with Options interface
3. Add to `src/cli.ts` imports and Commander registration
4. Rebuild: `npm run build`

**New CDP Method:**
1. Add method to CDPClient class in `src/cdp.ts`
2. Use `this.send(method, params)` pattern
3. Add corresponding command in `src/commands/` if needed

**New Type/Interface:**
1. Add to `src/types.ts`
2. Import in consuming files

**New Profile:**
1. Edit `src/profiles.ts`
2. Add entry to PROFILES object

**Utility Functions:**
- Shared helpers: Add to new `src/utils.ts` file
- Import in commands as needed

## Module Boundaries

**Dependency Direction:**
```
cli.ts → commands/*.ts → cdp.ts → types.ts
                      → profiles.ts
```

**Module Separation:**
- `cli.ts`: CLI registration only, no business logic
- `commands/*.ts`: Command logic, no direct WebSocket/HTTP calls
- `cdp.ts`: Protocol abstraction, no CLI dependencies
- `types.ts`: Pure type definitions, no runtime code
- `profiles.ts`: Configuration data, no dependencies

**No Circular Dependencies:**
- Clean unidirectional dependency graph
- Types are foundational (no imports)
- CDPClient depends on types only
- Commands depend on CDPClient and types
- CLI depends on commands only

## Configuration Files

**package.json**
- Name, version, description, license
- Dependencies: axios, chalk, commander, ws
- Dev dependencies: TypeScript, tsup, @types/*
- Scripts: build, dev
- Binary: `dv` → `./dist/cli.js`

**tsconfig.json**
- Target: ES2022
- Module: ESNext
- Module resolution: node
- Output: `./dist`
- Root: `./src`
- Strict mode enabled
- Source maps and declarations enabled

**.gitignore**
- node_modules/
- dist/ (commented out, dist is committed)
- *.log

**.npmignore**
- src/
- node_modules/
- *.md (except README.md)
- test scripts

## Build Outputs

**dist/**
- `cli.js`: ESM bundle (25KB, compiled from src/cli.ts)
- Generated by: `npm run build` (tsup)
- Format: ESM (ECMAScript modules)
- Includes all dependencies bundled

**Build Process:**
```bash
npm run build
# → tsup src/cli.ts --format esm
# → dist/cli.js created
```

**Distribution:**
- npm package includes `dist/cli.js`
- Source maps and declarations enabled but not committed
- Users install globally: `npm install -g @anthropic/dv-cli`

## Asset Organization

**No Non-Code Assets:**
- This is a pure CLI tool with no static assets
- No images, fonts, or media files
- Documentation in markdown files

**Runtime Artifacts:**
- `.dv-session.json`: Created at runtime to store session state
- Test screenshots (e.g., `test-screenshot.png`): Generated during testing

## Test Organization

**Test Files:**
- `test-complete.sh`: Complete test suite (bash)
- `test-workflow.sh`: Workflow test (bash)
- `test-workflow.ps1`: Workflow test (PowerShell)
- `test-script.js`: JavaScript test execution

**Test Pattern:**
- Shell scripts invoke CLI commands in sequence
- Test Chrome startup, navigation, interaction, screenshot
- Located in root directory (not in separate test/ folder)

**No Formal Test Framework:**
- No Jest, Mocha, or Vitest
- Tests are shell scripts that exercise CLI commands
- Screenshot comparison for visual testing

## Special Files

**.dv-session.json**
- Purpose: Persist session state between commands
- Contains: `{ currentPageId, currentProfile, port }`
- Generated: Yes (at runtime)
- Committed: Yes (in version control)
- Used by: All commands to remember current page

**Shebang**
- `src/cli.ts`: `#!/usr/bin/env node` at line 1
- Makes compiled JS executable as standalone script

---

*Structure analysis: 2026-06-16*
