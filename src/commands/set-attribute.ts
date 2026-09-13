import { CDPClient } from '../cdp.js';
import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
import { applyToElement } from './apply-to-element.js';

export interface SetAttributeOptions extends TabOptions {
  profile: string;
  selector: string;
  attr: string;
  value: string;
}

export async function setAttribute(options: SetAttributeOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect(targetTab(options));

    console.log(chalk.blue(`Setting attribute ${options.attr} on ${options.selector}`));
    await applyToElement(
      client,
      options.selector,
      `el.setAttribute(${JSON.stringify(options.attr)}, ${JSON.stringify(options.value)});`
    );

    console.log(chalk.green(`✓ Attribute "${options.attr}" set to "${options.value}"`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}
