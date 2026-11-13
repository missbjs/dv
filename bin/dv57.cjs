#!/usr/bin/env node
// Pins this binary to profile dv57; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv57';
require('../dist/cli.js');
