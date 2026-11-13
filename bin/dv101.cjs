#!/usr/bin/env node
// Pins this binary to profile dv101; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv101';
require('../dist/cli.js');
