#!/usr/bin/env node
// Pins this binary to profile dv65; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv65';
require('../dist/cli.js');
