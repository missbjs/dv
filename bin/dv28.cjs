#!/usr/bin/env node
// Pins this binary to profile dv28; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv28';
require('../dist/cli.js');
