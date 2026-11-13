#!/usr/bin/env node
// Pins this binary to profile dv90; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv90';
require('../dist/cli.js');
