import { CDPClient } from '../cdp.js';
import chalk from 'chalk';

export interface KeyOptions {
  port: number;
  key: string;
}

export async function key(options: KeyOptions) {
  const client = new CDPClient(options.port);

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