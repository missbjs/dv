# Technology Stack

**Analysis Date:** 2026-06-16

## Languages

**Primary:**
- TypeScript 5.5.0 - All source code in `src/` directory

**Secondary:**
- JavaScript (ES2022) - Compilation target, emitted to `dist/`

## Runtime

**Environment:**
- Node.js >=18.0.0 - Required engine version

**Package Manager:**
- npm - Package manager
- Lockfile: Not detected (no package-lock.json in root)

## Frameworks

**Core:**
- Commander 12.1.0 - CLI argument parsing and command structure

**Testing:**
- Not configured - No test framework detected

**Build/Dev:**
- tsup 8.1.0 - TypeScript bundler for ESM output
- TypeScript 5.5.0 - Compiler with strict mode enabled

## Key Dependencies

**Critical:**
- ws 8.18.0 - WebSocket client for Chrome DevTools Protocol connection
- axios 1.7.0 - HTTP client for Chrome DevTools HTTP endpoints
- chalk 5.3.0 - Terminal output coloring

**Infrastructure:**
- None - This is a CLI tool with no infrastructure dependencies

## Dev Dependencies

**Type Definitions:**
- @types/node 22.0.0 - Node.js type definitions
- @types/ws 8.5.12 - WebSocket type definitions

**Build Tools:**
- tsup 8.1.0 - Zero-config TypeScript bundler
- typescript 5.5.0 - TypeScript compiler

## Configuration

**TypeScript:**
- Target: ES2022
- Module: ESNext (ESM output)
- Module Resolution: Node
- Strict mode: Enabled
- Source maps: Enabled
- Declaration files: Generated

**Build:**
- tsup configured via npm scripts
- Output format: ESM only
- Entry point: `src/cli.ts`

**Environment:**
- ESM modules (`"type": "module"` in package.json)
- CLI binary: `dv` → `./dist/cli.js`

## Platform Requirements

**Development:**
- Node.js >=18.0.0
- TypeScript 5.5.0
- tsup 8.1.0

**Production:**
- Node.js >=18.0.0
- Chrome/Chromium browser (for DevTools Protocol)

**Platform Support:**
- Windows: Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`
- macOS: Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- Linux: `google-chrome` in PATH

---

*Stack analysis: 2026-06-16*
