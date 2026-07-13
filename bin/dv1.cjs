#!/usr/bin/env node
// Skip --profile injection for commands that don't need it
const subIdx = process.argv.findIndex((a, i) => i > 1 && !a.startsWith('-'));
const subcommand = subIdx >= 0 ? process.argv[subIdx] : '';
if (subcommand !== 'profiles') {
  if (subIdx >= 0) {
    process.argv.splice(subIdx + 1, 0, '--profile', 'dv1');
  } else {
    process.argv.push('--profile', 'dv1');
  }
}
process.env.DV_BIN_NAME = 'dv1';
require('../dist/cli.js');