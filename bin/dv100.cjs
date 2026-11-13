#!/usr/bin/env node
// Pins this binary to profile dv100; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv100';
require('../dist/cli.js');
