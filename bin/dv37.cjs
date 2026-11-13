#!/usr/bin/env node
// Pins this binary to profile dv37; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv37';
require('../dist/cli.js');
