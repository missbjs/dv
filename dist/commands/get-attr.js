import { CDPClient } from '../cdp.js';
import { targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
import { wantsStructured, renderStructured } from '../output.js';
export async function getAttr(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect(targetTab(options));
        const value = await client.getElementAttribute(options.selector, options.attr);
        if (value === null) {
            console.error(chalk.red(`Element not found: ${options.selector}`));
            process.exit(1);
        }
        if (wantsStructured(options)) {
            console.log(renderStructured({ [options.attr]: value }, options));
        }
        else {
            console.log(value || chalk.gray(`(attribute "${options.attr}" not found)`));
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
//# sourceMappingURL=get-attr.js.map