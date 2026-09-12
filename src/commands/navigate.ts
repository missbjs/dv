import { CDPClient } from '../cdp.js';
import { TabOptions, targetTab } from '../tab.js';
import { ensureChromeRunning } from '../ensureChrome.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface NavigateOptions extends TabOptions {
  profile: string;
  url: string;
}

export async function navigate(options: NavigateOptions) {
  // Auto-start Chrome if it's not running
  await ensureChromeRunning(options.profile);

  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect(targetTab(options));
    await client.enablePage();

    console.log(chalk.blue(`Navigating to ${options.url}...`));
    await client.navigate(options.url);

    console.log(chalk.green('Navigation complete'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}