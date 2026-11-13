#!/usr/bin/env node
// Pins this binary to profile dv17; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv17';
require('../dist/cli.js');
