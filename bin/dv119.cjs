#!/usr/bin/env node
// Pins this binary to profile dv119; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv119';
require('../dist/cli.js');
