#!/usr/bin/env node
// Pins this binary to profile dv34; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv34';
require('../dist/cli.js');
