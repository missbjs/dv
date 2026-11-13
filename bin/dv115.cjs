#!/usr/bin/env node
// Pins this binary to profile dv115; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv115';
require('../dist/cli.js');
