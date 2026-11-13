#!/usr/bin/env node
// Pins this binary to profile dv81; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv81';
require('../dist/cli.js');
