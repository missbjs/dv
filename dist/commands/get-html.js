import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
export async function getHtml(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect();
        const result = await client.evaluate(`document.querySelector('${options.selector}')?.outerHTML || ''`);
        if (result.result?.value !== undefined) {
            console.log(result.result.value);
        }
        else {
            console.log(chalk.gray('Element not found'));
        }
    }
    catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
    }
    finally {
        await client.close();
    }
}
//# sourceMappingURL=get-html.js.map