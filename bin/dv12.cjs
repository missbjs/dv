#!/usr/bin/env node
// Pins this binary to profile dv12; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv12';
require('../dist/cli.js');
