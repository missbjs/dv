#!/usr/bin/env node
// Pins this binary to profile dv19; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv19';
require('../dist/cli.js');
