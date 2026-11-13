#!/usr/bin/env node
// Pins this binary to profile dv60; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv60';
require('../dist/cli.js');
