#!/usr/bin/env node
// Pins this binary to profile dv61; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv61';
require('../dist/cli.js');
