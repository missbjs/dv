#!/usr/bin/env node
// Pins this binary to profile dv26; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv26';
require('../dist/cli.js');
