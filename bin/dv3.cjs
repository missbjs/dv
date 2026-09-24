#!/usr/bin/env node
// Pins this binary to profile dv3; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv3';
require('../dist/cli.js');
