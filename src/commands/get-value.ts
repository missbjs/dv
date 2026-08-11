import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
import { wantsStructured, renderStructured } from '../output.js';

export interface GetValueOptions {
  profile: string;
  selector: string;
  json?: boolean;
  yaml?: boolean;
}

export async function getValue(options: GetValueOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();
    const value = await client.getElementValue(options.selector);

    if (value === null) {
      console.error(chalk.red(`Element not found: ${options.selector}`));
      process.exit(1);
    }

    if (wantsStructured(options)) {
      console.log(renderStructured({ value }, options));
    } else {
      console.log(value || chalk.gray('(empty)'));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}