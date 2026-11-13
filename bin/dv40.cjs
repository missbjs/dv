#!/usr/bin/env node
// Pins this binary to profile dv40; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv40';
require('../dist/cli.js');
