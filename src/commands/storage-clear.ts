import { CDPClient } from '../cdp.js';
import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface StorageClearOptions extends TabOptions {
  profile: string;
  type: 'local' | 'session' | 'all';
}

export async function storageClear(options: StorageClearOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  const requested = targetTab(options);

  try {
    await client.connect(requested);

    console.log(chalk.blue('Clearing storage...'));

    const targets = await client.getTargets();
    // The origin has to come from the tab we actually connected to — deriving it
    // from the default tab would clear storage for the wrong site under --tab.
    const tab = requested
      ? targets.find((t) => t.id === requested) ?? null
      : client.getCurrentTab(targets);
    if (!tab) {
      console.error(chalk.red('No tab found'));
      process.exit(1);
    }

    const origin = tab.url;

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