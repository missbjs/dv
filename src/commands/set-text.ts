import { CDPClient } from '../cdp.js';
import chalk from 'chalk';

export interface SetTextOptions {
  port: number;
  selector: string;
  value: string;
}

export async function setText(options: SetTextOptions) {
  const client = new CDPClient(options.port);

  try {
    await client.loadState();
    await client.connect();

    console.log(chalk.blue(`Setting text content of ${options.selector}`));
    await client.evaluate(
      `const el = document.querySelector('${options.selector}'); if (el) el.textContent = '${options.value.replace(/'/g, "\\'")}';`
    );

    console.log(chalk.green('✓ Text content updated'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}
