#!/usr/bin/env node
// Pins this binary to profile dv69; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv69';
require('../dist/cli.js');
