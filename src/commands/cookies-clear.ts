import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface CookiesClearOptions {
  profile: string;
  domain?: string;
}

export async function cookiesClear(options: CookiesClearOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();

    console.log(chalk.blue('Clearing cookies...'));
    await client.clearCookies();

    console.log(chalk.green('✓ All cookies cleared'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}