#!/usr/bin/env node
// Pins this binary to profile dv122; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv122';
require('../dist/cli.js');
