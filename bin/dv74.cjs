#!/usr/bin/env node
// Pins this binary to profile dv74; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv74';
require('../dist/cli.js');
