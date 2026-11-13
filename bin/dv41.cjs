#!/usr/bin/env node
// Pins this binary to profile dv41; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv41';
require('../dist/cli.js');
