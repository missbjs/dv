#!/usr/bin/env node
// Pins this binary to profile dv121; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv121';
require('../dist/cli.js');
