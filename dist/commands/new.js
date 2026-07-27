import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
export async function newPage(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        console.log(chalk.blue(`Creating new tab: ${options.url}...`));
        const tab = await client.newTab(options.url);
        if (options.json) {
            console.log(JSON.stringify(tab, null, 2));
        }
        else {
            console.log(chalk.green('New tab created'));
            console.log(chalk.gray(`ID: ${tab.id}`));
            console.log(chalk.gray(`URL: ${tab.url}`));
        }
    }
    catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
    }
}
//# sourceMappingURL=new.js.map