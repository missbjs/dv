#!/usr/bin/env node
// Pins this binary to profile dv82; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv82';
require('../dist/cli.js');
