import { CDPClient } from '../cdp.js';
import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
import { applyToElement } from './apply-to-element.js';

export interface SetHtmlOptions extends TabOptions {
  profile: string;
  selector: string;
  value: string;
}

export async function setHtml(options: SetHtmlOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect(targetTab(options));

    console.log(chalk.blue(`Setting HTML of ${options.selector}`));
    await applyToElement(client, options.selector, `el.innerHTML = ${JSON.stringify(options.value)};`);

    console.log(chalk.green('✓ HTML updated'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}
