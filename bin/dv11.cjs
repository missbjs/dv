#!/usr/bin/env node
// Pins this binary to profile dv11; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv11';
require('../dist/cli.js');
