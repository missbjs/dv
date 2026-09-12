import { CDPClient } from '../cdp.js';
import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { wantsStructured, renderStructured } from '../output.js';
import { getPortFromProfile } from '../utils.js';

export interface SessionStorageOptions extends TabOptions {
  profile: string;
  key?: string;
  json?: boolean;
  yaml?: boolean;
}

export async function sessionStorage(options: SessionStorageOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect(targetTab(options));

    console.log(chalk.blue('Getting sessionStorage...'));
    const result = await client.evaluate(`
      JSON.stringify(Array.from({ length: sessionStorage.length }, (_, i) => {
        const k = sessionStorage.key(i);
        return [k, sessionStorage.getItem(k)];
      }))
    `);

    if (result?.exceptionDetails) {
      console.error(chalk.red(`Error: ${result.exceptionDetails.text}`));
      process.exit(1);
    }

    let items: string[][] = [];
    try {
      items = JSON.parse(result.result.value);
    } catch {
      // no items
    }

    if (wantsStructured(options)) {
      console.log(renderStructured(items, options));
    } else {
      if (!items || items.length === 0) {
        console.log(chalk.gray('No sessionStorage items found'));
        return;
      }

      console.log(chalk.green(`\n✓ Found ${items.length} item(s):\n`));
      items.forEach((item: string[], index: number) => {
        const [key, value] = item;
        if (!options.key || key === options.key) {
          console.log(chalk.white(`${index + 1}. ${key}`));
          console.log(chalk.gray(`   Value: ${value}`));
        }
      });
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}