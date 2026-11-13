#!/usr/bin/env node
// Pins this binary to profile dv38; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv38';
require('../dist/cli.js');
