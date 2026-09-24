import { spawn } from 'child_process';
import { getProfile } from './profiles.js';
import { profileDir } from './runtime.js';
import { CDPClient } from './cdp.js';
import chalk from 'chalk';

/**
 * Ensure Chrome is running for the given profile.
 * If Chrome is already running, returns immediately.
 * If not, starts Chrome and waits for it to be ready.
 */
export async function ensureChromeRunning(profileName: string, headless?: boolean): Promise<void> {
  const profileConfig = getProfile(profileName);
  if (!profileConfig) {
    console.error(chalk.red(`Profile not found: ${profileName}`));
    console.error(chalk.yellow('Available profiles:'));
    console.error('  dv1 through dv6');
    process.exit(1);
  }

  const validProfiles = ['dv1', 'dv2', 'dv3', 'dv4', 'dv5', 'dv6'];
  if (!validProfiles.includes(profileName)) {
    console.error(chalk.red('Invalid profile name'));
    process.exit(1);
  }

  const port = profileConfig.port;
  const client = new CDPClient(port);

  // Check if already running
  try {
    await client.getTargets();
    return;
  } catch {
    // Not running — proceed to start
  }

  console.log(chalk.blue(`Starting Chrome on port ${port}...`));

  const args = [
    `--remote-debugging-port=${port}`,
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profileDir(profileName)}`,
  ];

  if (headless) {
    args.push('--headless=new');
  }

  const chromePath = process.env.CHROME_PATH
    ?? (process.platform === 'win32'
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      : process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : 'google-chrome');

  const chrome = spawn(chromePath, args, {
    detached: true,
    stdio: 'ignore',
  });

  chrome.unref();

  // Wait for Chrome to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Verify it started
  try {
    await client.getTargets();
    console.log(chalk.green(`Chrome started successfully on port ${port}`));
  } catch {
    console.log(chalk.yellow('Chrome may still be starting.'));
  }
}