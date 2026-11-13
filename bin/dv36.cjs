#!/usr/bin/env node
// Pins this binary to profile dv36; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv36';
require('../dist/cli.js');
