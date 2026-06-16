import { CDPClient } from '../cdp.js';
import chalk from 'chalk';

export interface LocalStorageOptions {
  port: number;
  key?: string;
  json?: boolean;
}

export async function localStorage(options: LocalStorageOptions) {
  const client = new CDPClient(options.port);

  try {
    await client.loadState();
    await client.connect();

    const page = await client.getCurrentPage();
    if (!page) {
      console.error(chalk.red('No page found'));
      process.exit(1);
    }

    const origin = page.url;

    console.log(chalk.blue('Getting localStorage...'));
    const result = await client.getStorageItems(origin, 'local_storage');

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      if (!result || result.length === 0) {
        console.log(chalk.gray('No localStorage items found'));
        return;
      }

      console.log(chalk.green(`\n✓ Found ${result.length} item(s):\n`));
      result.forEach((item: string[], index: number) => {
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