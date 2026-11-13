#!/usr/bin/env node
// Pins this binary to profile dv104; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv104';
require('../dist/cli.js');
