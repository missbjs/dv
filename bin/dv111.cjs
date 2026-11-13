#!/usr/bin/env node
// Pins this binary to profile dv111; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv111';
require('../dist/cli.js');
