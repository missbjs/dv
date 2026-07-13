import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface UserAgentOptions {
  profile: string;
  ua: string;
}

export async function userAgent(options: UserAgentOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();

    console.log(chalk.blue('Setting user agent...'));
    await client.setUserAgentOverride(options.ua);

    console.log(chalk.green('✓ User agent override set'));
    console.log(chalk.gray(`User Agent: ${options.ua}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}
