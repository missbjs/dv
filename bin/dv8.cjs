#!/usr/bin/env node
// Pins this binary to profile dv8; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv8';
require('../dist/cli.js');
