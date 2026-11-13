#!/usr/bin/env node
// Pins this binary to profile dv80; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv80';
require('../dist/cli.js');
