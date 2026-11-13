#!/usr/bin/env node
// Pins this binary to profile dv77; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv77';
require('../dist/cli.js');
