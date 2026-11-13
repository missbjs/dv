#!/usr/bin/env node
// Pins this binary to profile dv83; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv83';
require('../dist/cli.js');
