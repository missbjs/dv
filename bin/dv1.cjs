#!/usr/bin/env node
// Pins this binary to profile dv1; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv1';
require('../dist/cli.js');
