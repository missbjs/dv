#!/usr/bin/env node
// Pins this binary to profile dv85; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv85';
require('../dist/cli.js');
