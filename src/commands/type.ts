import { CDPClient } from '../cdp.js';
import chalk from 'chalk';

export interface TypeOptions {
  port: number;
  selector: string;
  text: string;
}

export async function type(options: TypeOptions) {
  const client = new CDPClient(options.port);

  try {
    await client.loadState();
    await client.connect();

    console.log(chalk.blue(`Typing "${options.text}" into ${options.selector}...`));
    await client.type(options.selector, options.text);

    console.log(chalk.green('Type successful'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}