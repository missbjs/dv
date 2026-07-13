import { readFileSync, writeFileSync } from 'fs';
let c = readFileSync('src/cli.ts', 'utf8');
const before = c;
const pattern = ".requiredOption('--profile <profile>', 'Profile name (dv1 through dv6)');";
const count = (c.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
console.log('Found:', count, 'occurrences');
c = c.split(pattern).join('.addOption(profileOption);');
writeFileSync('src/cli.ts', c);
console.log('Replaced:', count);