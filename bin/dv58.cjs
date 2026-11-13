#!/usr/bin/env node
// Pins this binary to profile dv58; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv58';
require('../dist/cli.js');
