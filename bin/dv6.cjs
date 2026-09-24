#!/usr/bin/env node
// Pins this binary to profile dv6; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv6';
require('../dist/cli.js');
