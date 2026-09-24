// Builds release/dv.exe (standalone, Bun runtime embedded) plus dv1.cmd…dv6.cmd,
// each of which runs dv.exe pinned to one profile. Chrome profiles are created
// lazily, once, under release/profiles/dvN on first `dvN start`.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'release');
const { version } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const exe = process.platform === 'win32' ? 'dv.exe' : 'dv';

mkdirSync(out, { recursive: true });
execFileSync('bun', [
  'build', '--compile', '--minify',
  `--define=__DV_VERSION__=${JSON.stringify(version)}`,
  path.join(root, 'src', 'cli.ts'),
  '--outfile', path.join(out, exe),
], { stdio: 'inherit' });

for (let n = 1; n <= 6; n++) {
  writeFileSync(path.join(out, `dv${n}.cmd`),
    `@echo off\r\nsetlocal\r\nset "DV_BIN_NAME=dv${n}"\r\n"%~dp0${exe}" %*\r\nexit /b %ERRORLEVEL%\r\n`);
}
console.log(`dv ${version} -> ${out}`);
