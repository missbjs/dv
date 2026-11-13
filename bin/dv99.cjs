#!/usr/bin/env node
// Pins this binary to profile dv99; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv99';
require('../dist/cli.js');
