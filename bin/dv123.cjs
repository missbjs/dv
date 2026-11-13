#!/usr/bin/env node
// Pins this binary to profile dv123; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv123';
require('../dist/cli.js');
