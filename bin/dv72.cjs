#!/usr/bin/env node
// Pins this binary to profile dv72; src/runtime.ts forceProfile() applies it.
process.env.DV_BIN_NAME = 'dv72';
require('../dist/cli.js');
