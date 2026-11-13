#!/usr/bin/env node
// Pins this binary to profile dv63; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv63';
require('../dist/cli.js');
