import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface SelectOptions {
  profile: string;
  tabId?: string;
  index?: number;
}

export async function select(options: SelectOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    const targets = await client.getTargets();
    const tabs = targets.filter(t => t.type === 'page');

    let selectedTab;

    if (options.tabId) {
      selectedTab = tabs.find(p => p.id === options.tabId);
    } else if (options.index !== undefined) {
      selectedTab = tabs[options.index - 1];
    } else {
      console.error(chalk.red('Use --tab-id or --index to select a tab'));
      process.exit(1);
    }

    if (!selectedTab) {
      console.error(chalk.red('Tab not found'));
      process.exit(1);
    }

    console.log(chalk.green(`Selected tab: ${selectedTab.title}`));
    console.log(chalk.gray(`URL: ${selectedTab.url}`));
    console.log(chalk.gray(`ID: ${selectedTab.id}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }
}