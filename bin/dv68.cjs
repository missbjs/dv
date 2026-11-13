#!/usr/bin/env node
// Pins this binary to profile dv68; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv68';
require('../dist/cli.js');
