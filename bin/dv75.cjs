#!/usr/bin/env node
// Pins this binary to profile dv75; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv75';
require('../dist/cli.js');
