# Test Configuration

## Test Ports (Separate from Production)

| Endpoint | First | Last | Formula |
|----------|-------|------|---------|
| Production Chrome CDP (`dv1`–`dv128`) | 9230 | 9357 | `9229 + N`, `1 ≤ N ≤ 128` |
| Production private recorder (loopback) | 19230 | 19357 | `19229 + N`, `1 ≤ N ≤ 128` |
| Synthetic mock servers (`test-dv1`–`test-dv6`) | 9430 | 9435 | `9429 + N`, `1 ≤ N ≤ 6` |

This separation prevents test runs from interfering with production Chrome instances.

## Test Profiles

Mock servers use these synthetic labels and ports; these are not production
profile names and must never be used to launch Chrome:
- `test-dv1` → port 9430
- `test-dv2` → port 9431
- `test-dv3` → port 9432
- `test-dv4` → port 9433
- `test-dv5` → port 9434
- `test-dv6` → port 9435

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test test/cdp.test.ts

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Categories

1. **Unit Tests** - Test individual functions and classes
2. **Integration Tests** - Test CLI commands with mocked CDP
3. **Profile Tests** - Test profile configuration system
4. **Security Tests** - Test input validation and security fixes

## Mock WebSocket

Tests use a mock WebSocket server that simulates CDP protocol responses without requiring a real Chrome instance.