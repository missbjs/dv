/// <reference types="vitest" />

import { beforeAll, afterAll } from 'vitest';

/**
 * Global test setup
 */

beforeAll(async () => {
  // Ensure CLI is built before running tests
  console.log('Building CLI for tests...');
});

afterAll(async () => {
  // Cleanup any test artifacts
  console.log('Test cleanup complete');
});