import { CDPClient } from '../cdp.js';
import chalk from 'chalk';

export interface UserAgentOptions {
  port: number;
  ua: string;
}

export async function userAgent(options: UserAgentOptions) {
  const client = new CDPClient(options.port);

  try {
    await client.loadState();
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
