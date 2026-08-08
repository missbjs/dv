import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface HoverOptions {
  profile: string;
  selector: string;
}

export async function hover(options: HoverOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();
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