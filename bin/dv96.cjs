#!/usr/bin/env node
// Pins this binary to profile dv96; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv96';
require('../dist/cli.js');
