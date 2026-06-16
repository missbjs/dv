import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { promises as fs } from 'fs';

export interface EvalOptions {
  port: number;
  script?: string;
  file?: string;
  json?: boolean;
}

export async function evalCommand(options: EvalOptions) {
  const client = new CDPClient(options.port);

  try {
    await client.loadState();
    await client.connect();
    await client.enableRuntime();

    let expression = '';

    if (options.file) {
      expression = await fs.readFile(options.file, 'utf-8');
    } else if (options.script) {
      expression = options.script;
    } else {
      console.error(chalk.red('Either --script or --file is required'));
      process.exit(1);
    }

    const result = await client.evaluate(expression);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      if (result.result?.value !== undefined) {
        console.log(result.result.value);
      } else {
        console.log(chalk.gray('undefined'));
      }
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}