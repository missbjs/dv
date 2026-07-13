import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export async function clearCache(options: { profile: string }) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
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
