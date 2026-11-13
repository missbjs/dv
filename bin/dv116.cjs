#!/usr/bin/env node
// Pins this binary to profile dv116; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv116';
require('../dist/cli.js');
