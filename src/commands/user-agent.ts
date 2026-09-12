import { CDPClient } from '../cdp.js';
import { sessionScopedNote } from '../emulation.js';
import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface UserAgentOptions extends TabOptions {
  profile: string;
  ua: string;
}

export async function userAgent(options: UserAgentOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect(targetTab(options));

    console.log(chalk.blue('Setting user agent...'));
    await client.setUserAgentOverride(options.ua);

    console.log(chalk.green('✓ User agent override set'));
    console.log(chalk.gray(`User Agent: ${options.ua}`));
    for (const line of sessionScopedNote('user agent')) {
      console.log(chalk.gray(line));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}
