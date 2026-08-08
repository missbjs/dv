import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface DialogOptions {
  profile: string;
  accept?: boolean;
  dismiss?: boolean;
  text?: string;
}

export async function dialog(options: DialogOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();

    // Enable dialog handling
    await client.send('Page.enable');

    // Set up a one-shot handler for the next dialog
    const ws = (client as any).ws;
    if (!ws) {
      console.error(chalk.red('Not connected'));
      process.exit(1);
    }

    const accept = options.dismiss !== true; // default: accept
    const promptText = options.text || '';

    const result = await new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => {
        ws.removeListener('message', handler);
        reject(new Error('No dialog appeared within 30s'));
      }, 30000);

      const handler = (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.method === 'Page.javascriptDialogOpening') {
            clearTimeout(timer);
            ws.removeListener('message', handler);

            const dialogType = msg.message?.type || 'alert';
            const dialogMessage = msg.message?.message || '';

            // Respond to the dialog
            client.send('Page.handleJavaScriptDialog', {
              accept,
              promptText: accept ? promptText : undefined,
            }).then(() => {
              resolve({ type: dialogType, message: dialogMessage, accepted: accept });
            }).catch(reject);
          }
        } catch {}
      };

      ws.on('message', handler);
    });

    const action = result.accepted ? 'Accepted' : 'Dismissed';
    console.log(chalk.green(`${action} ${result.type} dialog: "${result.message}"`));
    if (result.accepted && promptText) {
      console.log(chalk.gray(`Prompt text: "${promptText}"`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}