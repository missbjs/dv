#!/usr/bin/env node
// Pins this binary to profile dv89; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv89';
require('../dist/cli.js');
