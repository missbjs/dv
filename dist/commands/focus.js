import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
export async function focus(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect();
        console.log(chalk.blue(`Focusing "${options.selector}"...`));
        await client.focusBySelector(options.selector);
        console.log(chalk.green('Focus successful'));
    }
    catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
    }
    finally {
        await client.close();
    }
}
//# sourceMappingURL=focus.js.map