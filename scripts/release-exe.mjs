// Packages release/ into dv-win-x64.zip and (with --publish) tags v<version>
// and creates the GitHub release carrying the zip.
//   node scripts/release-exe.mjs            build + zip only (safe, local)
//   node scripts/release-exe.mjs --publish  also git tag, push tag, gh release
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'release');
const { version } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const tag = `v${version}`;
const zip = path.join(out, 'dv-win-x64.zip');
const publish = process.argv.includes('--publish');
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: 'inherit', cwd: root, ...opts });

if (publish) {
  const dirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=no', '--', '.', ':!node_modules'], { cwd: root, encoding: 'utf8' }).trim();
  if (dirty) throw new Error(`working tree not clean; commit first:\n${dirty}`);
  const existing = execFileSync('git', ['tag', '-l', tag], { cwd: root, encoding: 'utf8' }).trim();
  if (existing) throw new Error(`tag ${tag} already exists; bump package.json version first`);
}

run('node', [path.join('scripts', 'build-exe.mjs')]);

rmSync(zip, { force: true });
const files = ['dv.exe', ...[1, 2, 3, 4, 5, 6].map(n => `dv${n}.cmd`)];
run('powershell', ['-NoProfile', '-Command',
  `Compress-Archive -LiteralPath ${files.map(f => `'${path.join(out, f)}'`).join(',')} -DestinationPath '${zip}'`]);
console.log(`packaged ${zip}`);

if (!publish) {
  console.log(`dry run: re-run with --publish to tag ${tag} and create the GitHub release`);
} else {
  run('git', ['tag', tag]);
  run('git', ['push', 'origin', tag]);
  run('gh', ['release', 'create', tag, zip, '--title', `dv ${version}`,
    '--notes', `Standalone Windows build. Unzip anywhere, put the folder on PATH, use dv1…dv6.\n\nInstall the Node version instead: pnpm i -g github:missbjs/dv#${tag}`]);
}
