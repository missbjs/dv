import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
export async function close(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        console.log(chalk.blue(`Closing tab ${options.tab}...`));
        await client.closeTab(options.tab);
        console.log(chalk.green('Tab closed'));
    }
    catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
    }
    finally {
        await client.close();
    }
}
//# sourceMappingURL=close.js.map