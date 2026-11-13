#!/usr/bin/env node
// Pins this binary to profile dv88; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv88';
require('../dist/cli.js');
