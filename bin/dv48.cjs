#!/usr/bin/env node
// Pins this binary to profile dv48; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv48';
require('../dist/cli.js');
