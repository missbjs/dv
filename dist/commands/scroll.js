import { CDPClient } from '../cdp.js';
import { targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
export async function scroll(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect(targetTab(options));
        const deltaX = options.deltaX ?? 0;
        const deltaY = options.deltaY ?? 0;
        if (options.selector) {
            console.log(chalk.blue(`Scrolling element "${options.selector}" by (${deltaX}, ${deltaY})...`));
            await client.scrollIntoView(options.selector);
            await client.scrollBy(options.selector, deltaX, deltaY);
        }
        else {
            console.log(chalk.blue(`Scrolling window by (${deltaX}, ${deltaY})...`));
            await client.scrollBy(null, deltaX, deltaY);
        }
        console.log(chalk.green('Scroll successful'));
    }
    catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
    }
    finally {
        await client.close();
    }
}
//# sourceMappingURL=scroll.js.map