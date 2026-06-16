import { CDPClient } from '../cdp.js';
import chalk from 'chalk';

export interface ClickOptions {
  port: number;
  selector: string;
}

export async function click(options: ClickOptions) {
  const client = new CDPClient(options.port);

  try {
    await client.loadState();
    await client.connect();

    console.log(chalk.blue(`Clicking ${options.selector}...`));
    await client.click(options.selector);

    console.log(chalk.green('Click successful'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}