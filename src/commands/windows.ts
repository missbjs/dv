import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { wantsStructured, renderStructured } from '../output.js';
import { getPortFromProfile } from '../utils.js';

export interface WindowsOptions {
  profile: string;
  json?: boolean;
  yaml?: boolean;
}

export async function windows(options: WindowsOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    const windows = await client.getWindows();

    if (wantsStructured(options)) {
      console.log(renderStructured(windows, options));
    } else {
      if (windows.length === 0) {
        console.log(chalk.gray('No windows found'));
        return;
      }

      const totalTabs = windows.reduce((n, w) => n + w.tabs.length, 0);
      console.log(chalk.blue(`Found ${windows.length} window(s), ${totalTabs} tab(s):\n`));
      windows.forEach((win, index) => {
        console.log(`${chalk.bold(`${index + 1}.`)} Window ${win.windowId} (${win.tabs.length} tab(s))`);
        console.log(chalk.gray(`  Bounds: ${win.bounds ? JSON.stringify(win.bounds) : 'unknown'}`));
        win.tabs.forEach((tab, tabIndex) => {
          console.log(chalk.gray(`  Tab ${tabIndex + 1}: ID=${tab.id} "${tab.title}" ${tab.url}`));
        });
        console.log();
      });
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }
}
