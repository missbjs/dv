import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { getProfile } from '../profiles.js';
import { CDPClient } from '../cdp.js';
import chalk from 'chalk';

// Anchor profile data dirs to the dv package root so they live in one fixed
// place regardless of where `dv` was invoked from. __dirname here points at
// dist/ at runtime; the package root is one level up.
const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export interface StartOptions {
  profile: string;
  headed?: boolean;
}

export async function start(options: StartOptions) {
  const profile = getProfile(options.profile);
  if (!profile) {
    console.error(chalk.red(`Profile not found: ${options.profile}`));
    console.error(chalk.yellow('Available profiles:'));
    console.error('  profile-1 through profile-6');
    process.exit(1);
  }

  // Validate profile name to prevent path traversal
  const validProfiles = ['profile-1', 'profile-2', 'profile-3', 'profile-4', 'profile-5', 'profile-6'];
  if (!validProfiles.includes(options.profile)) {
    console.error(chalk.red('Invalid profile name'));
    process.exit(1);
  }

  const port = profile.port;
  const profilePath = options.profile;

  // Check if Chrome is already running on this port
  const client = new CDPClient(port);
  try {
    const targets = await client.getTargets();
    console.log(chalk.green.bold('✓ Chrome is already running on port ' + port));
    console.log(chalk.gray(`DevTools URL: http://localhost:${port}`));
    console.log(chalk.gray(`Open pages: ${targets.filter(t => t.type === 'page').length}`));
    console.log();
    console.log(chalk.yellow('Use existing instance or specify a different port.'));
    return;
  } catch (error) {
    // Chrome is not running, proceed to start it
  }

  const args = [
    `--remote-debugging-port=${port}`,
    '--no-first-run',
    '--no-default-browser-check',
  ];

  if (profilePath) {
    args.push(`--user-data-dir=${path.join(PKG_ROOT, profilePath)}`);
  }

  if (!options.headed) {
    args.push('--headless=new');
  }

  // Detect Chrome executable based on platform
  let chromePath: string;
  if (process.platform === 'win32') {
    chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  } else if (process.platform === 'darwin') {
    chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  } else {
    chromePath = 'google-chrome';
  }

  console.log(chalk.blue(`Starting Chrome on port ${port}...`));
  console.log(chalk.gray(`Profile: ${profilePath || 'default'}`));
  console.log(chalk.gray(`Headed: ${options.headed ? 'yes' : 'no'}`));

  const chrome = spawn(chromePath, args, {
    detached: true,
    stdio: 'ignore',
  });

  chrome.unref();

  // Wait a bit for Chrome to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Verify Chrome started successfully
  try {
    await client.getTargets();
    console.log(chalk.green(`Chrome started successfully on port ${port}`));
    console.log(chalk.gray(`DevTools URL: http://localhost:${port}`));
  } catch (error) {
    console.log(chalk.yellow('Chrome may still be starting. Check with: dv status --port ' + port));
  }
}