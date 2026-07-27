import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
export async function snapshot(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect();
        console.log(chalk.blue('Taking accessibility snapshot...'));
        const result = await client.takeSnapshot();
        if (options.json) {
            console.log(JSON.stringify(result, null, 2));
        }
        else {
            console.log(chalk.green('Snapshot captured'));
            console.log(chalk.gray(`Documents: ${result.documents?.length || 0}`));
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
//# sourceMappingURL=snapshot.js.map