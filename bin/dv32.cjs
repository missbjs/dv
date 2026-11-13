#!/usr/bin/env node
// Pins this binary to profile dv32; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv32';
require('../dist/cli.js');
