#!/usr/bin/env node
// Pins this binary to profile dv114; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv114';
require('../dist/cli.js');
