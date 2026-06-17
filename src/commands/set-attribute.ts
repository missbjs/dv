import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface SetAttributeOptions {
  profile: string;
  selector: string;
  attr: string;
  value: string;
}

export async function setAttribute(options: SetAttributeOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.loadState();
    await client.connect();

    console.log(chalk.blue(`Setting attribute ${options.attr} on ${options.selector}`));
    await client.evaluate(
      `const el = document.querySelector('${options.selector}'); if (el) el.setAttribute('${options.attr}', '${options.value.replace(/'/g, "\\'")}');`
    );

    console.log(chalk.green(`✓ Attribute "${options.attr}" set to "${options.value}"`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}
