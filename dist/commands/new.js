import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { wantsStructured, renderStructured } from '../output.js';
import { getPortFromProfile } from '../utils.js';
import { ensureNetworkRecorder } from '../network-recorder.js';
import { recorderCall } from '../network-service.js';
export async function newPage(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        if (!wantsStructured(options))
            console.log(chalk.blue(`Creating new tab: ${options.url}...`));
        const tab = await client.newTab('about:blank');
        await ensureNetworkRecorder(options.profile);
        await recorderCall(options.profile, 'select', { tabId: tab.id });
        await client.connect(tab.id);
        await client.send('Page.bringToFront');
        await client.navigateAndWait(options.url);
        tab.url = options.url;
        if (wantsStructured(options)) {
            console.log(renderStructured(tab, options));
        }
        else {
            console.log(chalk.green('New tab created'));
            console.log(chalk.gray(`ID: ${tab.id}`));
            console.log(chalk.gray(`URL: ${tab.url}`));
        }
    }
    catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exitCode = 1;
    }
    finally {
        await client.close();
    }
}
//# sourceMappingURL=new.js.map