#!/usr/bin/env node
// Pins this binary to profile dv98; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv98';
require('../dist/cli.js');
