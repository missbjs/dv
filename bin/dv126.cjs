#!/usr/bin/env node
// Pins this binary to profile dv126; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv126';
require('../dist/cli.js');
