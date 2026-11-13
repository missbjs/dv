#!/usr/bin/env node
// Pins this binary to profile dv51; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv51';
require('../dist/cli.js');
