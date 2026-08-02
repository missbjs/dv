import { ensureChromeRunning } from '../ensureChrome.js';
import { getPortFromProfile } from '../utils.js';
import { CDPClient } from '../cdp.js';
import chalk from 'chalk';

export interface StartOptions {
  headless?: boolean;
  profile: string;
}

export async function start(options: StartOptions) {
  // Check if already running first so we can show details
  const client = new CDPClient(getPortFromProfile(options.profile));
  try {
    const targets = await client.getTargets();
    console.log(chalk.green.bold('✓ Chrome is already running on port ' + getPortFromProfile(options.profile)));
    console.log(chalk.gray(`DevTools URL: http://localhost:${getPortFromProfile(options.profile)}`));
    console.log(chalk.gray(`Open pages: ${targets.filter(t => t.type === 'page').length}`));
    return;
  } catch {
    // Not running — delegate to ensureChromeRunning
  }

  await ensureChromeRunning(options.profile, options.headless);
}