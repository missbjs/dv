#!/usr/bin/env node
// Pins this binary to profile dv110; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv110';
require('../dist/cli.js');
