#!/usr/bin/env node
// Pins this binary to profile dv15; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv15';
require('../dist/cli.js');
