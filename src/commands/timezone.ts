import { CDPClient } from '../cdp.js';
import chalk from 'chalk';

export interface TimezoneOptions {
  port: number;
  tz: string;
}

export async function timezone(options: TimezoneOptions) {
  const client = new CDPClient(options.port);

  try {
    await client.loadState();
    await client.connect();

    console.log(chalk.blue(`Setting timezone: ${options.tz}`));
    await client.setTimezoneOverride(options.tz);

    console.log(chalk.green('✓ Timezone override set'));
    console.log(chalk.gray(`Timezone: ${options.tz}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}
