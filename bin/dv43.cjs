#!/usr/bin/env node
// Pins this binary to profile dv43; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv43';
require('../dist/cli.js');
