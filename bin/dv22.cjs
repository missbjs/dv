#!/usr/bin/env node
// Pins this binary to profile dv22; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv22';
require('../dist/cli.js');
