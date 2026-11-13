#!/usr/bin/env node
// Pins this binary to profile dv113; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv113';
require('../dist/cli.js');
