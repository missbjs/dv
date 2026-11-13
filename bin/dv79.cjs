#!/usr/bin/env node
// Pins this binary to profile dv79; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv79';
require('../dist/cli.js');
