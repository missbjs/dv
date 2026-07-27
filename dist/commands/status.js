import { CDPClient } from '../cdp.js';
import { getPortFromProfile } from '../utils.js';
import chalk from 'chalk';
export async function status(options) {
    const port = getPortFromProfile(options.profile);
    const client = new CDPClient(port);
    try {
        const targets = await client.getTargets();
        const tabs = targets.filter(t => t.type === 'page');
        console.log(chalk.green.bold('✓ Chrome is running on port ' + port));
        console.log(chalk.gray(`DevTools URL: http://localhost:${port}`));
        console.log();
        if (tabs.length > 0) {
            console.log(chalk.blue(`Open tabs: ${tabs.length}`));
            tabs.forEach((tab, index) => {
                console.log(`  ○ ${index + 1}. ${tab.title}`);
                console.log(chalk.gray(`     URL: ${tab.url}`));
                console.log(chalk.gray(`     ID: ${tab.id}`));
            });
        }
        else {
            console.log(chalk.yellow('No open tabs'));
        }
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Chrome is not running')) {
            console.log(chalk.red.bold('✗ Chrome is not running on port ' + port));
            console.log(chalk.yellow('\nTo start Chrome:'));
            console.log(chalk.gray(`  dv ${options.profile} start`));
        }
        else {
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
            process.exit(1);
        }
    }
}
//# sourceMappingURL=status.js.map