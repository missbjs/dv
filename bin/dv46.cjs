#!/usr/bin/env node
// Pins this binary to profile dv46; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv46';
require('../dist/cli.js');
