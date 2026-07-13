import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface TimezoneOptions {
  profile: string;
  tz: string;
}

export async function timezone(options: TimezoneOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
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
