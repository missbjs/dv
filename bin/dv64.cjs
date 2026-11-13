#!/usr/bin/env node
// Pins this binary to profile dv64; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv64';
require('../dist/cli.js');
