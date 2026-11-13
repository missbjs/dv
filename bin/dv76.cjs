#!/usr/bin/env node
// Pins this binary to profile dv76; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv76';
require('../dist/cli.js');
