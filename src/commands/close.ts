import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface CloseOptions {
  profile: string;
  pageId?: string;
}

export async function close(options: CloseOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    if (!options.pageId) {
      const state = await client.loadState();
      options.pageId = state?.currentPageId ?? undefined;

      if (!options.pageId) {
        console.error(chalk.red('No page selected. Use --page-id or select a page first.'));
        process.exit(1);
      }
    }

    console.log(chalk.blue(`Closing page ${options.pageId}...`));
    await client.closePage(options.pageId);

    console.log(chalk.green('Page closed'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }
}