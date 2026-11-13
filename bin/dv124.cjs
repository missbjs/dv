#!/usr/bin/env node
// Pins this binary to profile dv124; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv124';
require('../dist/cli.js');
