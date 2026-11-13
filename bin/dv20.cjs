#!/usr/bin/env node
// Pins this binary to profile dv20; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv20';
require('../dist/cli.js');
