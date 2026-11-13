#!/usr/bin/env node
// Pins this binary to profile dv54; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv54';
require('../dist/cli.js');
