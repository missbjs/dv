#!/usr/bin/env node
// Pins this binary to profile dv128; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv128';
require('../dist/cli.js');
