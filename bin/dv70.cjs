#!/usr/bin/env node
// Pins this binary to profile dv70; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv70';
require('../dist/cli.js');
