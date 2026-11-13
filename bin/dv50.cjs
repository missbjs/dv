#!/usr/bin/env node
// Pins this binary to profile dv50; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv50';
require('../dist/cli.js');
