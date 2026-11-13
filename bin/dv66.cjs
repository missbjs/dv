#!/usr/bin/env node
// Pins this binary to profile dv66; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv66';
require('../dist/cli.js');
