#!/usr/bin/env node
// Pins this binary to profile dv117; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv117';
require('../dist/cli.js');
