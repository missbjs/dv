#!/usr/bin/env node
// Pins this binary to profile dv5; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv5';
require('../dist/cli.js');
