#!/usr/bin/env node
// Pins this binary to profile dv52; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv52';
require('../dist/cli.js');
