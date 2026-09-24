#!/usr/bin/env node
// Pins this binary to profile dv4; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv4';
require('../dist/cli.js');
