#!/usr/bin/env node
// Pins this binary to profile dv55; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv55';
require('../dist/cli.js');
