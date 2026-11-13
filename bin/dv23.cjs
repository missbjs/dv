#!/usr/bin/env node
// Pins this binary to profile dv23; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv23';
require('../dist/cli.js');
