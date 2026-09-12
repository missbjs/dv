import { CDPClient } from '../cdp.js';
import { sessionScopedNote } from '../emulation.js';
import { targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
export async function timezone(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect(targetTab(options));
        console.log(chalk.blue(`Setting timezone: ${options.tz}`));
        await client.setTimezoneOverride(options.tz);
        console.log(chalk.green('✓ Timezone override set'));
        console.log(chalk.gray(`Timezone: ${options.tz}`));
        for (const line of sessionScopedNote('timezone')) {
            console.log(chalk.gray(line));
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
//# sourceMappingURL=timezone.js.map