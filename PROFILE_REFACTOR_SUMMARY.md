# Profile System Refactor - Summary

## Overview

Successfully refactored the dv CLI to use a mandatory profile system, removing the `--port` option entirely.

## Changes Made

### 1. Profile Configuration
- **Old**: Profiles named `profile-qmdj-{1-6}` with ports 9222-9227
- **New**: Profiles named `dv{1-6}` with ports 9230-9235
- **Purpose**: All profiles now support OAuth equally (no special "OAuth pinned" profile)

### 2. CLI Arguments
- **Removed**: `--port` option from all 49 commands
- **Added**: Mandatory `profile` command prefix to all commands
- **Behavior**: Users must specify a profile as a command prefix, cannot specify arbitrary ports

### 3. Code Changes
- Created `src/utils.ts` with `getPortFromProfile()` helper
- Updated all 37 command implementation files
- Updated `src/cli.ts` CLI definitions for all commands
- Updated `src/profiles.ts` with new profile names and ports
- Updated `.gitignore` to use generic `profile-*` pattern

### 4. Documentation
- Updated `README.md` with new profile examples
- All examples now use positional `profile` argument instead of `--port`
- Documented that all profiles support persistent OAuth

### 5. Testing
- Created comprehensive test suite (`test-profile-system.sh`)
- Verified:
  - All commands have `profile` command prefix
  - `--port` option is completely removed
  - Profile validation works correctly
  - Error handling for invalid profiles works
  - Port range is 9230-9235

## Breaking Changes

Users must update their workflows:
```bash
# OLD (no longer works)
dv start --port 9222 --headed
dv navigate --port 9222 --url https://example.com

# NEW (required)
dv1 start --headed
dv1 goto https://example.com
```

## Benefits

1. **Consistency**: All commands use a profile as a command prefix, no confusion about port vs profile
2. **Simplicity**: No need to remember port numbers, just use short profile names like `dv1`
3. **Safety**: Prevents AI agent collisions through mandatory profile selection
4. **OAuth**: All profiles maintain authentication state equally
5. **Testing**: Each profile has dedicated port for parallel testing

## Profile Details

| Profile | Port  |
|---------|-------|
| dv1 | 9230 |
| dv2 | 9231 |
| dv3 | 9232 |
| dv4 | 9233 |
| dv5 | 9234 |
| dv6 | 9235 |

## Files Changed

- `src/profiles.ts` (profile definitions)
- `src/utils.ts` (new helper utility)
- `src/cli.ts` (CLI argument definitions)
- All 37 command files in `src/commands/`
- `README.md` (documentation)
- `.gitignore` (profile pattern)
- `test-profile-system.sh` (new test suite)

## Testing Results

All tests passed:
- ✓ CLI builds successfully
- ✓ Profile system works correctly
- ✓ All commands use `profile` command prefix
- ✓ Profile names are dv1 through dv6
- ✓ Ports are 9230-9235
- ✓ Error handling works
- ✓ --port option completely removed