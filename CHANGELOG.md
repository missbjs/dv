# Changelog

## @missbjs/dv

### Package renamed from dv-cli to dv (2026-06-16)

### Summary
Made `--port` parameter mandatory for all CDP commands to prevent AI agents from accidentally interfering with each other's browser instances when using default port 9222.

### Problem
- AI agents tended to use the default port 9222 when port was optional
- Multiple agents could accidentally close or manipulate each other's browser instances
- No isolation between different agent workflows

### Solution
- Made `--port` a required parameter for all commands that connect to Chrome
- Forces explicit port specification, preventing accidental collisions
- Agents must now consciously choose which browser instance to interact with

### Commands Updated
All 15 commands now require `--port`:

1. **navigate** - Navigate to URL
2. **eval** - Evaluate JavaScript
3. **snapshot** - Take accessibility snapshot
4. **screenshot** - Take screenshot
5. **console** - List console messages
6. **click** - Click element
7. **fill** - Fill input
8. **type** - Type text
9. **key** - Press key
10. **pages** - List open pages
11. **select** - Select page
12. **new** - Open new page
13. **close** - Close page
14. **resize** - Resize viewport
15. **monitor** - Monitor console

**Note:** `start` command does not require `--port` when using `--profile`, as profile determines the port.

### Example Usage

**Before (risky):**
```bash
dv start --profile profile-qmdj-1  # Launches on port 9222
dv close                            # Closes port 9222 by default - collision risk!
```

**After (safe):**
```bash
dv start --profile profile-qmdj-1  # Launches on port 9222
dv close --port 9223               # Must specify port - no collision!
```

### Profile System
The existing profile system (profile-qmdj-1 through profile-qmdj-6) provides port assignments:
- profile-qmdj-1: port 9222 (OAuth pinned)
- profile-qmdj-2: port 9223 (Parallel testing)
- profile-qmdj-3: port 9224 (Parallel testing)
- profile-qmdj-4: port 9225 (Parallel testing)
- profile-qmdj-5: port 9226 (Parallel testing)
- profile-qmdj-6: port 9227 (Parallel testing)

### Files Modified
- `src/cli.ts` - Added requiredOption for --port to all commands
- `src/commands/navigate.ts` - Added port parameter
- `src/commands/eval.ts` - Added port parameter
- `src/commands/snapshot.ts` - Added port parameter
- `src/commands/screenshot.ts` - Added port parameter
- `src/commands/console.ts` - Added port parameter
- `src/commands/click.ts` - Added port parameter
- `src/commands/fill.ts` - Added port parameter
- `src/commands/type.ts` - Added port parameter
- `src/commands/key.ts` - Added port parameter
- `src/commands/pages.ts` - Added port parameter
- `src/commands/select.ts` - Added port parameter
- `src/commands/new.ts` - Added port parameter
- `src/commands/close.ts` - Added port parameter
- `src/commands/resize.ts` - Added port parameter
- `src/commands/monitor.ts` - Added port parameter

### Testing
- Build: ✅ TypeScript compilation successful
- CLI: ✅ Commands enforce required port parameter
- Validation: ✅ Commands fail with error if port not specified
