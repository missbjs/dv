import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface ConsoleOptions {
  profile: string;
  type?: 'log' | 'warn' | 'error' | 'info' | 'debug';
  filter?: string;
  json?: boolean;
  clear?: boolean;
}

export async function consoleCommand(options: ConsoleOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.loadState();
    await client.connect();
    await client.enableConsole();

    const messages = await client.getConsoleMessages();

    let filtered = messages;

    if (options.type) {
      filtered = filtered.filter(m => m.type === options.type);
    }

    if (options.filter) {
      const regex = new RegExp(options.filter, 'i');
      filtered = filtered.filter(m => regex.test(m.text));
    }

    if (options.json) {
      console.log(JSON.stringify(filtered, null, 2));
    } else {
      if (filtered.length === 0) {
        console.log(chalk.gray('No console messages'));
        return;
      }

      filtered.forEach(msg => {
        const typeColors: Record<string, typeof chalk.red> = {
          error: chalk.red,
          warn: chalk.yellow,
          log: chalk.white,
          info: chalk.blue,
          debug: chalk.gray,
        };

        const color = typeColors[msg.type] || chalk.white;
        console.log(color(`[${msg.type}] ${msg.text}`));

        if (msg.url) {
          console.log(chalk.gray(`  at ${msg.url}:${msg.line}:${msg.column}`));
        }
      });
    }

    if (options.clear) {
      await client.clearConsoleMessages();
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}