import { CDPClient } from '../cdp.js';
import chalk from 'chalk';

export interface FillOptions {
  port: number;
  selector: string;
  value: string;
}

export async function fill(options: FillOptions) {
  const client = new CDPClient(options.port);

  try {
    await client.loadState();
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