import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
export async function localStorage(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect();
        const targets = await client.getTargets();
        const tab = client.getCurrentTab(targets);
        if (!tab) {
            console.error(chalk.red('No tab found'));
            process.exit(1);
        }
        const origin = tab.url;
        console.log(chalk.blue('Getting localStorage...'));
        const result = await client.getStorageItems(origin, 'local_storage');
        if (options.json) {
            console.log(JSON.stringify(result, null, 2));
        }
        else {
            if (!result || result.length === 0) {
                console.log(chalk.gray('No localStorage items found'));
                return;
            }
            console.log(chalk.green(`\n✓ Found ${result.length} item(s):\n`));
            result.forEach((item, index) => {
                const [key, value] = item;
                if (!options.key || key === options.key) {
                    console.log(chalk.white(`${index + 1}. ${key}`));
                    console.log(chalk.gray(`   Value: ${value}`));
                }
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
//# sourceMappingURL=local-storage.js.map