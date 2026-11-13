#!/usr/bin/env node
// Pins this binary to profile dv112; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv112';
require('../dist/cli.js');
