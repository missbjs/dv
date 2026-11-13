#!/usr/bin/env node
// Pins this binary to profile dv87; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv87';
require('../dist/cli.js');
