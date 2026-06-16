import { CDPClient } from '../cdp.js';
import chalk from 'chalk';

export interface GetTextOptions {
  port: number;
  selector: string;
}

export async function getText(options: GetTextOptions) {
  const client = new CDPClient(options.port);

  try {
    await client.loadState();
    await client.connect();

    const result = await client.evaluate(
      `document.querySelector('${options.selector}')?.textContent || ''`
    );

    if (result.result?.value !== undefined) {
      console.log(result.result.value);
    } else {
      console.log(chalk.gray('Element not found or no text content'));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}
