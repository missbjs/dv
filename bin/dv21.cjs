#!/usr/bin/env node
// Pins this binary to profile dv21; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv21';
require('../dist/cli.js');
