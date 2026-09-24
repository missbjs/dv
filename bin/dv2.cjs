#!/usr/bin/env node
// Pins this binary to profile dv2; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv2';
require('../dist/cli.js');
