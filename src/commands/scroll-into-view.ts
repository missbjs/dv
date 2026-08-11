import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface ScrollIntoViewOptions {
  profile: string;
  selector: string;
}

export async function scrollIntoView(options: ScrollIntoViewOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();
    console.log(chalk.blue(`Scrolling ${options.selector} into view...`));
    await client.scrollIntoView(options.selector);
    console.log(chalk.green('Scrolled into view'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}