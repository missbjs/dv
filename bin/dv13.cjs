#!/usr/bin/env node
// Pins this binary to profile dv13; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv13';
require('../dist/cli.js');
