import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { wantsStructured, renderStructured } from '../output.js';
import { ensureNetworkRecorder, historyTab } from '../network-recorder.js';
import { recorderCall } from '../network-service.js';
import { NetworkEntry } from '../network-store.js';

export interface RequestOptions extends TabOptions {
  profile: string; id: string; body?: boolean; json?: boolean; yaml?: boolean;
}
export async function request(options: RequestOptions) {
  try {
    await ensureNetworkRecorder(options.profile);
    const explicit = targetTab(options);
    const opaque = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}:\d+$/i.test(options.id);
    const tabId = explicit ?? (opaque ? undefined : await historyTab(options.profile));
    const req: NetworkEntry = await recorderCall(options.profile, 'get', { id: options.id, tabId, body: options.body });
    if (wantsStructured(options)) { console.log(renderStructured(req, options)); return; }
    console.log(chalk.bold(`\n${req.method} ${req.url}`));
    console.log(chalk.gray(`ID: ${req.id}\nTab: ${req.tabId}\nType: ${req.type}\nState: ${req.state}`));
    if (req.status !== undefined) console.log(chalk.gray(`Status: ${req.status}`));
    if (req.errorText) console.log(chalk.red(req.errorText));
    if (req.responseHeaders) {
      console.log(chalk.gray('\nHeaders:'));
      for (const [key, value] of Object.entries(req.responseHeaders)) console.log(chalk.gray(`  ${key}: ${value}`));
    }
    if (options.body) {
      if (req.body) {
        console.log(chalk.blue(req.body.base64Encoded ? '\nResponse Body (base64):' : '\nResponse Body:'));
        console.log(req.body.body);
      } else console.log(chalk.yellow(`Response body not available (${req.bodyState})`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exitCode = 1;
  }
}
