#!/usr/bin/env node
// Pins this binary to profile dv53; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv53';
require('../dist/cli.js');
