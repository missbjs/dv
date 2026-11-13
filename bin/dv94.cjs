#!/usr/bin/env node
// Pins this binary to profile dv94; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv94';
require('../dist/cli.js');
