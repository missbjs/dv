import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface MonitorOptions {
  profile: string;
  types: string;
}

export async function monitor(options: MonitorOptions) {
  const types = options.types.split(',').map(t => t.trim());
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.loadState();
    await client.connect();
    await client.enableConsole();

    console.log(chalk.blue(`Monitoring console messages (types: ${types.join(', ')})...`));
    console.log(chalk.gray('Press Ctrl+C to stop\n'));

    // Keep the connection alive and listen for console messages
    const checkMessages = async () => {
      const messages = await client.getConsoleMessages();
      const filtered = messages.filter(m => types.includes(m.type));

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

      await client.clearConsoleMessages();

      // Check again in 100ms
      setTimeout(checkMessages, 100);
    };

    checkMessages();

    // Keep the process running
    process.on('SIGINT', () => {
      console.log(chalk.blue('\nStopping monitor...'));
      client.close();
      process.exit(0);
    });
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }
}