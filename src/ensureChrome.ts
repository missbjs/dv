import { spawn } from 'child_process';
import { getProfile, listProfiles } from './profiles.js';
import { profileDir } from './runtime.js';
import { CDPClient } from './cdp.js';
import chalk from 'chalk';
import { ensureNetworkRecorder } from './network-recorder.js';

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
    console.error(`  ${listProfiles().map(p => p.name).join(', ')}`);
    process.exit(1);
  }

  const port = profileConfig.port;
  const client = new CDPClient(port);

  // Check if already running
  const running = await client.getTargets().then(() => true, () => false);
  if (running) {
    await ensureNetworkRecorder(profileName);
    return;
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

  let launchError: Error | undefined;
  chrome.on('error', error => { launchError = error; });
  chrome.unref();

  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (launchError) throw launchError;
    if (await client.getTargets().then(() => true, () => false)) {
      await ensureNetworkRecorder(profileName);
      console.log(chalk.green(`Chrome started successfully on port ${port}`));
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Chrome did not become ready on port ${port}`);
}