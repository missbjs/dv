#!/usr/bin/env node
// Pins this binary to profile dv62; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv62';
require('../dist/cli.js');
