#!/usr/bin/env node
// Pins this binary to profile dv44; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv44';
require('../dist/cli.js');
