#!/usr/bin/env node
// Pins this binary to profile dv42; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv42';
require('../dist/cli.js');
