#!/usr/bin/env node
// Pins this binary to profile dv10; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv10';
require('../dist/cli.js');
