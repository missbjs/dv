#!/usr/bin/env node
// Pins this binary to profile dv127; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv127';
require('../dist/cli.js');
