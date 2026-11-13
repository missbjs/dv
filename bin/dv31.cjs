#!/usr/bin/env node
// Pins this binary to profile dv31; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv31';
require('../dist/cli.js');
