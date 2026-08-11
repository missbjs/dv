import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface SelectOptions {
  profile: string;
  tab?: string;
  tabId?: string; // deprecated, use tab
  index?: number;
}

export async function select(options: SelectOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    const targets = await client.getTargets();
    const tabs = targets.filter(t => t.type === 'page');

    let selectedTab;

    const tabId = options.tab ?? options.tabId;
    if (tabId) {
      selectedTab = tabs.find(p => p.id === tabId);
    } else if (options.index !== undefined) {
      selectedTab = tabs[options.index - 1];
    } else {
      console.error(chalk.red('Use --tab or --index to select a tab'));
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