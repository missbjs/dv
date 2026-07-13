import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface SetHtmlOptions {
  profile: string;
  selector: string;
  value: string;
}

export async function setHtml(options: SetHtmlOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();

    console.log(chalk.blue(`Setting HTML of ${options.selector}`));
    const escapedHtml = options.value.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
    await client.evaluate(
      `const el = document.querySelector('${options.selector}'); if (el) el.innerHTML = \`${escapedHtml}\`;`
    );

    console.log(chalk.green('✓ HTML updated'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}