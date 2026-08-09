import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { wantsStructured, renderStructured } from '../output.js';
import { getPortFromProfile } from '../utils.js';
export async function queryAll(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect();
        console.log(chalk.blue(`Querying: ${options.selector}`));
        const nodeIds = await client.querySelectorAll(options.selector);
        if (wantsStructured(options)) {
            console.log(renderStructured({ count: nodeIds.length, nodeIds }, options));
        }
        else {
            console.log(chalk.green(`\n✓ Found ${nodeIds.length} element(s)`));
            nodeIds.forEach((id, index) => {
                console.log(chalk.white(`  ${index + 1}. Node ID: ${id}`));
            });
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
//# sourceMappingURL=query-all.js.map