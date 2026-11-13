#!/usr/bin/env node
// Pins this binary to profile dv16; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv16';
require('../dist/cli.js');
