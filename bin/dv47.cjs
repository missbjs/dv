#!/usr/bin/env node
// Pins this binary to profile dv47; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv47';
require('../dist/cli.js');
