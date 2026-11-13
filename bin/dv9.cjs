#!/usr/bin/env node
// Pins this binary to profile dv9; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv9';
require('../dist/cli.js');
