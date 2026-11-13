#!/usr/bin/env node
// Pins this binary to profile dv95; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv95';
require('../dist/cli.js');
