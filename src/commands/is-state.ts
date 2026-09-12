import { CDPClient } from '../cdp.js';
import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
import { wantsStructured, renderStructured } from '../output.js';

export interface IsStateOptions extends TabOptions {
  profile: string;
  selector: string;
  json?: boolean;
  yaml?: boolean;
}

async function isState(options: IsStateOptions, state: 'visible' | 'enabled' | 'checked') {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect(targetTab(options));

    let value: boolean | null;
    switch (state) {
      case 'visible':
        value = await client.isVisible(options.selector);
        break;
      case 'enabled':
        value = await client.isEnabled(options.selector);
        break;
      case 'checked':
        value = await client.isChecked(options.selector);
        break;
    }

    if (value === null) {
      console.error(chalk.red(`Element not found: ${options.selector}`));
      process.exit(1);
    }

    if (wantsStructured(options)) {
      console.log(renderStructured({ [state]: value }, options));
    } else {
      console.log(value ? chalk.green(`${state}: true`) : chalk.yellow(`${state}: false`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}

export async function isVisible(options: IsStateOptions) {
  await isState(options, 'visible');
}

export async function isEnabled(options: IsStateOptions) {
  await isState(options, 'enabled');
}

export async function isChecked(options: IsStateOptions) {
  await isState(options, 'checked');
}