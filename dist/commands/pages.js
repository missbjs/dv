import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
export async function pages(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        const targets = await client.getTargets();
        const pageTargets = targets.filter(t => t.type === 'page');
        const state = await client.loadState();
        if (options.json) {
            console.log(JSON.stringify(pageTargets, null, 2));
        }
        else {
            if (pageTargets.length === 0) {
                console.log(chalk.gray('No pages found'));
                return;
            }
            console.log(chalk.blue(`Found ${pageTargets.length} page(s):\n`));
            pageTargets.forEach((page, index) => {
                const current = page.id === state?.currentPageId;
                const marker = current ? chalk.green('*') : ' ';
                console.log(`${marker} ${chalk.bold(`${index + 1}.`)} ${page.title}`);
                console.log(chalk.gray(`  ID:  ${page.id}`));
                console.log(chalk.gray(`  URL: ${page.url}`));
                console.log();
            });
        }
    }
    catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
    }
}
//# sourceMappingURL=pages.js.map