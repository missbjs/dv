import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface FillOptions {
  profile: string;
  selector: string;
  value: string;
}

export async function fill(options: FillOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();

    console.log(chalk.blue(`Filling ${options.selector} with "${options.value}"...`));
    await client.fill(options.selector, options.value);

    console.log(chalk.green('Fill successful'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}