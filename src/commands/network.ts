import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { wantsStructured, renderStructured } from '../output.js';
import { ensureNetworkRecorder, historyTab } from '../network-recorder.js';
import { recorderCall } from '../network-service.js';
import { NetworkEntry } from '../network-store.js';

export interface NetworkOptions extends TabOptions {
  filter?: string; clear?: boolean; json?: boolean; yaml?: boolean; profile: string;
}

export async function network(options: NetworkOptions) {
  try {
    const regex = options.filter ? new RegExp(options.filter, 'i') : undefined;
    await ensureNetworkRecorder(options.profile);
    const tabId = await historyTab(options.profile, targetTab(options));
    if (options.clear) {
      const result = await recorderCall(options.profile, 'clear', { tabId });
      console.log(wantsStructured(options) ? renderStructured(result, options) : chalk.green('Network history and saved bodies cleared'));
      return;
    }
    const { entries } = await recorderCall(options.profile, 'list', { tabId });
    const filtered: NetworkEntry[] = regex ? entries.filter((r: NetworkEntry) => regex.test(r.url)) : entries;
    if (wantsStructured(options)) console.log(renderStructured(filtered, options));
    else if (!filtered.length) console.log(chalk.gray('No network requests found'));
    else {
      console.log(chalk.blue(`\n${filtered.length} request(s):\n`));
      for (const req of filtered) {
        const status = req.status !== undefined ? `[${req.status}]` : `[${req.state}]`;
        console.log(`${status} ${chalk.bold(req.method)} ${req.url}`);
        console.log(chalk.gray(`   ID: ${req.id}  Tab: ${req.tabId}  Type: ${req.type}  Body: ${req.bodyState}`));
      }
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exitCode = 1;
  }
}
