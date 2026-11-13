#!/usr/bin/env node
// Pins this binary to profile dv102; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv102';
require('../dist/cli.js');
