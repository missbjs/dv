import { CDPClient } from '../cdp.js';
import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface HoverOptions extends TabOptions {
  profile: string;
  selector: string;
}

export async function hover(options: HoverOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect(targetTab(options));
    console.log(chalk.blue(`Hovering over "${options.selector}"...`));
    await client.hoverBySelector(options.selector);
    console.log(chalk.green('Hover successful'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}