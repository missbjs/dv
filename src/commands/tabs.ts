import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { wantsStructured, renderStructured } from '../output.js';
import { getPortFromProfile } from '../utils.js';

export interface TabsOptions {
  profile: string;
  json?: boolean;
  yaml?: boolean;
}

export async function tabs(options: TabsOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    const targets = await client.getTargets();
    const tabTargets = targets.filter(t => t.type === 'page');

    if (wantsStructured(options)) {
      console.log(renderStructured(tabTargets, options));
    } else {
      if (tabTargets.length === 0) {
        console.log(chalk.gray('No tabs found'));
        return;
      }

      console.log(chalk.blue(`Found ${tabTargets.length} tab(s):\n`));
      tabTargets.forEach((tab, index) => {
        console.log(`${chalk.bold(`${index + 1}.`)} ${tab.title}`);
        console.log(chalk.gray(`  ID:  ${tab.id}`));
        console.log(chalk.gray(`  URL: ${tab.url}`));
        console.log();
      });
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }
}