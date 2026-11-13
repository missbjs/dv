#!/usr/bin/env node
// Pins this binary to profile dv35; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv35';
require('../dist/cli.js');
