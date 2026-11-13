// Builds release/dv.exe (standalone, Bun runtime embedded) plus dv1.cmd…dv128.cmd,
// each of which runs dv.exe pinned to one profile. Chrome profiles live in the
// shared %LOCALAPPDATA%\dv\profiles\dvN (same as the Node build), created on first `dvN start`.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'release');
const { version } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const exe = process.platform === 'win32' ? 'dv.exe' : 'dv';

// Compile locally without invoking the version-bumping npm build script.
execFileSync(process.execPath, [path.join(root, 'node_modules', 'typescript', 'bin', 'tsc')],
  { stdio: 'inherit', cwd: root });
const { listProfiles } = await import(pathToFileURL(path.join(root, 'dist', 'profiles.js')).href);

mkdirSync(out, { recursive: true });
execFileSync('bun', [
  'build', '--compile', '--minify',
  `--define=__DV_VERSION__=${JSON.stringify(version)}`,
  path.join(root, 'src', 'cli.ts'),
  '--outfile', path.join(out, exe),
], { stdio: 'inherit', cwd: root });

for (const { name } of listProfiles()) {
  writeFileSync(path.join(out, `${name}.cmd`),
    `@echo off\r\nsetlocal\r\nset "DV_BIN_NAME=${name}"\r\n"%~dp0${exe}" %*\r\nexit /b %ERRORLEVEL%\r\n`);
}
console.log(`dv ${version} -> ${out}`);
