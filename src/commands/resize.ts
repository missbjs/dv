import { CDPClient } from '../cdp.js';
import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface ResizeOptions extends TabOptions {
  profile: string;
  width: number;
  height: number;
}

export async function resize(options: ResizeOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));
  // 0 means "no override" in CDP — treat `resize 0 0` as "take the override off".
  const clearing = !options.width || !options.height;
  // Overrides are per-tab, so the undo has to be able to name a tab: without
  // this, an override on anything but the first content tab is reported by
  // `status` and unreachable by every command that could clear it.
  const tabId = targetTab(options);
  const tabSuffix = tabId ? ` --tab ${tabId}` : '';

  try {
    await client.connect(tabId);

    if (clearing) {
      console.log(chalk.blue('Clearing viewport override...'));
      await client.clearDeviceMetricsOverride();
      console.log(chalk.green('✓ Viewport override cleared'));
      console.log(chalk.gray('The tab is back to its real window size.'));
      if (tabId) {
        // The override is gone, but a hidden widget keeps its old inner size
        // until the tab is shown — so `status` can still flag it for a while.
        console.log(chalk.gray('If that tab is in the background it may keep reporting the old size until it is next in front.'));
      }
    } else {
      console.log(chalk.blue(`Resizing viewport to ${options.width}x${options.height}...`));
      await client.resize(options.width, options.height);
      console.log(chalk.green('Viewport resized'));
      console.log(chalk.gray(`This override is sticky — it survives reloads and navigation.`));
      console.log(chalk.gray(`Undo with: ${options.profile} resize 0 0${tabSuffix}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}
