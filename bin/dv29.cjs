#!/usr/bin/env node
// Pins this binary to profile dv29; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv29';
require('../dist/cli.js');
