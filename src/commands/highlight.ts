import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface HighlightOptions {
  profile: string;
  selector?: string;
  hide?: boolean;
}

export async function highlight(options: HighlightOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();

    if (options.hide) {
      console.log(chalk.blue('Hiding highlight...'));
      await client.hideHighlight();
      console.log(chalk.green('Highlight hidden'));
    } else if (options.selector) {
      console.log(chalk.blue(`Highlighting "${options.selector}"...`));
      await client.highlightNode(options.selector);
      console.log(chalk.green(`Element highlighted: ${options.selector}`));
    } else {
      console.error(chalk.red('Specify --selector or --hide'));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : JSON.stringify(error)}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}