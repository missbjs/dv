import { CDPClient } from '../cdp.js';
import { getPortFromProfile } from '../utils.js';
import chalk from 'chalk';

export interface StatusOptions {
  profile: string;
}

export async function status(options: StatusOptions) {
  const port = getPortFromProfile(options.profile);
  const client = new CDPClient(port);

  try {
    const targets = await client.getTargets();
    const pages = targets.filter(t => t.type === 'page');
    const state = await client.loadState();

    console.log(chalk.green.bold('✓ Chrome is running on port ' + port));
    console.log(chalk.gray(`DevTools URL: http://localhost:${port}`));
    console.log();

    if (pages.length > 0) {
      console.log(chalk.blue(`Open pages: ${pages.length}`));
      pages.forEach((page, index) => {
        const current = page.id === state?.currentPageId;
        const marker = current ? chalk.green('●') : '○';

        console.log(`${marker} ${index + 1}. ${page.title}`);
        console.log(chalk.gray(`   URL: ${page.url}`));
        console.log(chalk.gray(`   ID: ${page.id}`));
      });
    } else {
      console.log(chalk.yellow('No open pages'));
    }

    if (state?.currentProfile) {
      console.log();
      console.log(chalk.gray(`Active profile: ${state.currentProfile}`));
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Chrome is not running')) {
      console.log(chalk.red.bold('✗ Chrome is not running on port ' + port));
      console.log(chalk.yellow('\nTo start Chrome:'));
      console.log(chalk.gray(`  dv start --profile ${options.profile} --headed`));
    } else {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  }
}