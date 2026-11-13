#!/usr/bin/env node
// Pins this binary to profile dv18; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv18';
require('../dist/cli.js');
