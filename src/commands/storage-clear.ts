import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface StorageClearOptions {
  profile: string;
  type: 'local' | 'session' | 'all';
}

export async function storageClear(options: StorageClearOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.loadState();
    await client.connect();

    console.log(chalk.blue('Clearing storage...'));

    const page = await client.getCurrentPage();
    if (!page) {
      console.error(chalk.red('No page found'));
      process.exit(1);
    }

    const origin = page.url;

    if (options.type === 'all') {
      await client.clearDataForOrigin(origin, 'local_storage,session_storage');
      console.log(chalk.green('✓ All storage cleared'));
    } else {
      const storageType = options.type === 'local' ? 'local_storage' : 'session_storage';
      await client.clearDataForOrigin(origin, storageType);
      console.log(chalk.green(`✓ ${options.type} storage cleared`));
    }

    console.log(chalk.gray(`Origin: ${origin}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}