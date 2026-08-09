import { CDPClient } from '../cdp.js';
import { getPortFromProfile } from '../utils.js';
import chalk from 'chalk';
import { wantsStructured, renderStructured } from '../output.js';
export async function status(options) {
    const port = getPortFromProfile(options.profile);
    const client = new CDPClient(port);
    try {
        const targets = await client.getTargets();
        const tabs = targets.filter(t => t.type === 'page');
        if (wantsStructured(options)) {
            console.log(renderStructured({
                running: true,
                port,
                devToolsUrl: `http://localhost:${port}`,
                tabs: tabs.map((tab, index) => ({
                    index: index + 1,
                    title: tab.title,
                    url: tab.url,
                    id: tab.id,
                })),
            }, options));
            return;
        }
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
            if (wantsStructured(options)) {
                console.log(renderStructured({ running: false, port }, options));
                return;
            }
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