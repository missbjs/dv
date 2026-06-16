import { CDPClient } from '../cdp.js';
import chalk from 'chalk';

export interface SelectOptions {
  port: number;
  url?: string;
  pageId?: string;
  index?: number;
}

export async function select(options: SelectOptions) {
  const client = new CDPClient(options.port);

  try {
    const targets = await client.getTargets();
    const pages = targets.filter(t => t.type === 'page');

    let selectedPage;

    if (options.pageId) {
      selectedPage = pages.find(p => p.id === options.pageId);
    } else if (options.url) {
      selectedPage = pages.find(p => p.url.includes(options.url));
    } else if (options.index !== undefined) {
      selectedPage = pages[options.index - 1];
    } else {
      console.error(chalk.red('Use --url, --page-id, or --index to select a page'));
      process.exit(1);
    }

    if (!selectedPage) {
      console.error(chalk.red('Page not found'));
      process.exit(1);
    }

    const state = await client.loadState() || { currentPageId: null, currentProfile: null, port: 9222 };
    state.currentPageId = selectedPage.id;
    await client.saveState();

    console.log(chalk.green(`Selected page: ${selectedPage.title}`));
    console.log(chalk.gray(`URL: ${selectedPage.url}`));
    console.log(chalk.gray(`ID: ${selectedPage.id}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }
}