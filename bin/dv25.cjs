#!/usr/bin/env node
// Pins this binary to profile dv25; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv25';
require('../dist/cli.js');
