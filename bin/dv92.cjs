#!/usr/bin/env node
// Pins this binary to profile dv92; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv92';
require('../dist/cli.js');
