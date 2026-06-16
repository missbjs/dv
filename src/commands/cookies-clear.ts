import { CDPClient } from '../cdp.js';
import chalk from 'chalk';

export interface CookiesClearOptions {
  port: number;
  domain?: string;
}

export async function cookiesClear(options: CookiesClearOptions) {
  const client = new CDPClient(options.port);

  try {
    await client.loadState();
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