#!/usr/bin/env node
// Pins this binary to profile dv125; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv125';
require('../dist/cli.js');
