import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface ConsoleOptions {
  profile: string;
  type?: string;
  filter?: string;
  json?: boolean;
  tabId?: string;
}

// Map user-friendly short type names to CDP Console level values
const TYPE_ALIASES: Record<string, string> = {
  warn: 'warning',
  error: 'error',
  log: 'log',
  info: 'info',
  debug: 'debug',
};

export async function consoleCommand(options: ConsoleOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect(options.tabId);
    await client.enableConsole();

    const messages = await client.getConsoleMessages();

    let filtered = messages;

    if (options.type) {
      const cdpLevel = TYPE_ALIASES[options.type] || options.type;
      filtered = filtered.filter(m => m.type === cdpLevel);
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
          warning: chalk.yellow,
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
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}