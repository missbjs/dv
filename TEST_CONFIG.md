# Test Configuration

## Test Ports (Separate from Production)

Production ports: 9230-9235
Test ports: **9240-9245**

This separation prevents test runs from interfering with production Chrome instances.

## Test Profiles

For testing, use these profile names:
- `test-profile-1` → port 9240
- `test-profile-2` → port 9241
- `test-profile-3` → port 9242
- `test-profile-4` → port 9243
- `test-profile-5` → port 9244
- `test-profile-6` → port 9245

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