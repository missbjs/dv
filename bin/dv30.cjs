#!/usr/bin/env node
// Pins this binary to profile dv30; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv30';
require('../dist/cli.js');
