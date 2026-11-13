#!/usr/bin/env node
// Pins this binary to profile dv106; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv106';
require('../dist/cli.js');
