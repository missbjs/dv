#!/usr/bin/env node
// Pins this binary to profile dv105; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv105';
require('../dist/cli.js');
