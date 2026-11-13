#!/usr/bin/env node
// Pins this binary to profile dv103; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv103';
require('../dist/cli.js');
