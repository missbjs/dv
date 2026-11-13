#!/usr/bin/env node
// Pins this binary to profile dv86; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv86';
require('../dist/cli.js');
