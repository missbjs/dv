import { CDPClient } from '../cdp.js';
import chalk from 'chalk';

export interface InterceptOptions {
  port: number;
  url: string;
  action: 'block' | 'mock';
  response?: string;
}

export async function intercept(options: InterceptOptions) {
  const client = new CDPClient(options.port);

  try {
    await client.loadState();
    await client.connect();
    await client.enableNetwork();

    console.log(chalk.blue(`Setting up interception for: ${options.url}`));

    if (options.action === 'block') {
      await client.setRequestInterception([{ urlPattern: options.url, interceptionStage: 'Request' }]);

      console.log(chalk.green('✓ Blocking requests matching: ' + options.url));
      console.log(chalk.gray('Requests will be intercepted and blocked'));
    } else if (options.action === 'mock') {
      await client.setRequestInterception([{ urlPattern: options.url, interceptionStage: 'Request' }]);

      console.log(chalk.green('✓ Mocking requests matching: ' + options.url));
      if (options.response) {
        console.log(chalk.gray('Response: ' + options.response.substring(0, 100)));
      }
    }

    console.log(chalk.yellow('\nNote: Interception will remain active until browser is closed'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }
}
