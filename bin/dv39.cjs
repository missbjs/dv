#!/usr/bin/env node
// Pins this binary to profile dv39; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv39';
require('../dist/cli.js');
