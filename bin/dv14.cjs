#!/usr/bin/env node
// Pins this binary to profile dv14; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv14';
require('../dist/cli.js');
