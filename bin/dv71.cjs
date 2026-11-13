#!/usr/bin/env node
// Pins this binary to profile dv71; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv71';
require('../dist/cli.js');
