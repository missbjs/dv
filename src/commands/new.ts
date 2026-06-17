import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface NewOptions {
  profile: string;
  url: string;
  json?: boolean;
}

export async function newPage(options: NewOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    console.log(chalk.blue(`Creating new page: ${options.url}...`));
    const page = await client.newPage(options.url);

    const state = await client.loadState() || { currentPageId: null, currentProfile: null, port: 9222 };
    state.currentPageId = page.id;
    await client.saveState();

    if (options.json) {
      console.log(JSON.stringify(page, null, 2));
    } else {
      console.log(chalk.green('New page created'));
      console.log(chalk.gray(`ID: ${page.id}`));
      console.log(chalk.gray(`URL: ${page.url}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }
}