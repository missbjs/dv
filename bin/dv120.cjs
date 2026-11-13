#!/usr/bin/env node
// Pins this binary to profile dv120; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv120';
require('../dist/cli.js');
