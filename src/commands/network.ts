import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface NetworkOptions {
  filter?: string;
  json?: boolean;
  profile: string;
}

export async function network(options: NetworkOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();
    await client.enableNetwork();

    console.log(chalk.blue('Collecting network requests...'));
    await new Promise(resolve => setTimeout(resolve, 1000));

    const requests = await client.getNetworkRequests();
    let filtered = requests;

    if (options.filter) {
      const regex = new RegExp(options.filter, 'i');
      filtered = requests.filter(r => regex.test(r.url));
    }

    if (options.json) {
      console.log(JSON.stringify(filtered, null, 2));
    } else {
      if (filtered.length === 0) {
        console.log(chalk.gray('No network requests found'));
        return;
      }

      console.log(chalk.blue(`\n${filtered.length} request(s):\n`));
      filtered.forEach((req, index) => {
        const status = req.status ? chalk.green(`[${req.status}]`) : chalk.gray('[pending]');
        console.log(`${index + 1}. ${status} ${chalk.bold(req.method)} ${req.url}`);
        if (req.responseHeaders) {
          console.log(chalk.gray(`   Type: ${req.type}`));
        }
      });
    }

    await client.clearNetworkRequests();
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}
