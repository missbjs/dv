#!/usr/bin/env node
// Pins this binary to profile dv24; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv24';
require('../dist/cli.js');
