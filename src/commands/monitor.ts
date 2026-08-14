import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface MonitorOptions {
  types: string;
  profile: string;
}

// Map user-friendly short type names to CDP Console level values
const TYPE_ALIASES: Record<string, string> = {
  warn: 'warning',
  error: 'error',
  log: 'log',
  info: 'info',
  debug: 'debug',
};

export async function monitor(options: MonitorOptions) {
  const types = options.types.split(',').map(t => t.trim());
  const cdpTypes = types.map(t => TYPE_ALIASES[t] || t);
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();
    await client.enableConsole();

    console.log(chalk.blue(`Monitoring console messages (types: ${types.join(', ')})...`));
    console.log(chalk.gray('Press Ctrl+C to stop\n'));

    // Use a deferred promise that resolves on SIGINT (CR-07)
    const deferred = defer<void>();
    let interval: ReturnType<typeof setInterval> | null = null;

    const onSigint = () => {
      if (interval) clearInterval(interval);
      deferred.resolve();
    };
    process.on('SIGINT', onSigint);

    // Poll for console messages
    interval = setInterval(async () => {
      try {
        const messages = await client.getAndClearConsoleMessages();
        const filtered = messages.filter(m => cdpTypes.includes(m.type));

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
      } catch (err) {
        // Swallow poll errors — the connection may be closing
      }
    }, 100);

    await deferred.promise;

    process.removeListener('SIGINT', onSigint);
    await client.close();
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }
}

/** Create a deferred promise (resolvable from outside) */
function defer<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (reason?: any) => void } {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}