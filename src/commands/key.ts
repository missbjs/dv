import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface KeyOptions {
  profile: string;
  key: string;
}

export async function key(options: KeyOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.loadState();
    await client.connect();

    console.log(chalk.blue(`Pressing key ${options.key}...`));
    await client.pressKey(options.key);

    console.log(chalk.green('Key press successful'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}