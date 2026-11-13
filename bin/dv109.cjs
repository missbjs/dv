#!/usr/bin/env node
// Pins this binary to profile dv109; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv109';
require('../dist/cli.js');
