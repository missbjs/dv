import { CDPClient } from '../cdp.js';
import { targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
import { applyToElement } from './apply-to-element.js';
export async function setText(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect(targetTab(options));
        console.log(chalk.blue(`Setting text content of ${options.selector}`));
        await applyToElement(client, options.selector, `el.textContent = ${JSON.stringify(options.value)};`);
        console.log(chalk.green('✓ Text content updated'));
    }
    catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
    }
    finally {
        await client.close();
    }
}
//# sourceMappingURL=set-text.js.map