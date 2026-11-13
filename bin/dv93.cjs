#!/usr/bin/env node
// Pins this binary to profile dv93; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv93';
require('../dist/cli.js');
