#!/usr/bin/env node
// Pins this binary to profile dv78; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv78';
require('../dist/cli.js');
