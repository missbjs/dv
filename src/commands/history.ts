import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface HistoryOptions {
  profile: string;
  back?: boolean;
  forward?: boolean;
  list?: boolean;
  go?: number;
}

export async function history(options: HistoryOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();

    if (options.list) {
      const hist = await client.getNavigationHistory();
      const entries = hist.entries || [];
      const currentIndex = hist.currentIndex;

      console.log(chalk.blue('Navigation History\n'));
      entries.forEach((entry: any, i: number) => {
        const marker = i === currentIndex ? chalk.green('>') : ' ';
        const icon = entry.transitionType === 'reload' ? '↻' : '→';
        console.log(`  ${marker} ${chalk.cyan(`#${entry.id}`)} ${icon} ${entry.title || '(no title)'}`);
        console.log(`      ${chalk.gray(entry.url)}`);
        console.log();
      });
      console.log(chalk.gray(`Total: ${entries.length} entries, current index: ${currentIndex}`));
    } else if (options.back) {
      const hist = await client.getNavigationHistory();
      const entries = hist.entries || [];
      const currentIndex = hist.currentIndex;
      if (currentIndex > 0) {
        const target = entries[currentIndex - 1];
        console.log(chalk.blue(`Going back to: ${target?.url || 'previous page'}...`));
        await client.navigateToHistoryEntry(entries[currentIndex - 1].id);
        console.log(chalk.green('Navigated back'));
      } else {
        console.log(chalk.yellow('No history entry to go back to'));
      }
    } else if (options.forward) {
      const hist = await client.getNavigationHistory();
      const entries = hist.entries || [];
      const currentIndex = hist.currentIndex;
      if (currentIndex < entries.length - 1) {
        const target = entries[currentIndex + 1];
        console.log(chalk.blue(`Going forward to: ${target?.url || 'next page'}...`));
        await client.navigateToHistoryEntry(entries[currentIndex + 1].id);
        console.log(chalk.green('Navigated forward'));
      } else {
        console.log(chalk.yellow('No history entry to go forward to'));
      }
    } else if (options.go !== undefined) {
      const hist = await client.getNavigationHistory();
      const entries = hist.entries || [];
      const entry = entries.find((e: any) => e.id === options.go);
      if (entry) {
        console.log(chalk.blue(`Going to history entry #${options.go}: ${entry.url}...`));
        await client.navigateToHistoryEntry(options.go);
        console.log(chalk.green(`Navigated to #${options.go}`));
      } else {
        console.error(chalk.red(`History entry #${options.go} not found`));
        process.exit(1);
      }
    } else {
      console.error(chalk.red('Specify an action: --back, --forward, --list, or --go <entry>'));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}