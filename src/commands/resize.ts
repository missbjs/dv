import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface ResizeOptions {
  profile: string;
  width: number;
  height: number;
}

export async function resize(options: ResizeOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();

    console.log(chalk.blue(`Resizing viewport to ${options.width}x${options.height}...`));
    await client.resize(options.width, options.height);

    console.log(chalk.green('Viewport resized'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}