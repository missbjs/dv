#!/usr/bin/env node
// Pins this binary to profile dv107; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv107';
require('../dist/cli.js');
