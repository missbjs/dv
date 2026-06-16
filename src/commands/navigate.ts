import { CDPClient } from '../cdp.js';
import chalk from 'chalk';

export interface NavigateOptions {
  port: number;
  url: string;
  headed?: boolean;
}

export async function navigate(options: NavigateOptions) {
  const client = new CDPClient(options.port);

  try {
    await client.loadState();
    await client.connect();
    await client.enablePage();

    console.log(chalk.blue(`Navigating to ${options.url}...`));
    await client.navigate(options.url);

    console.log(chalk.green('Navigation complete'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}