#!/usr/bin/env node
// Pins this binary to profile dv97; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv97';
require('../dist/cli.js');
