#!/usr/bin/env node
// Pins this binary to profile dv45; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv45';
require('../dist/cli.js');
