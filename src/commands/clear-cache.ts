import { CDPClient } from '../cdp.js';
import chalk from 'chalk';

export interface ClearCacheOptions {
  port: number;
}

export async function clearCache(options: ClearCacheOptions) {
  const client = new CDPClient(options.port);

  try {
    await client.loadState();
    await client.connect();
    await client.enableNetwork();

    console.log(chalk.blue('Clearing browser cache...'));
    await client.clearBrowserCache();

    console.log(chalk.green('✓ Browser cache cleared'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}
