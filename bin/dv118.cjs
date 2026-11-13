#!/usr/bin/env node
// Pins this binary to profile dv118; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv118';
require('../dist/cli.js');
