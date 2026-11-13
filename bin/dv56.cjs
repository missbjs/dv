#!/usr/bin/env node
// Pins this binary to profile dv56; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv56';
require('../dist/cli.js');
