import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
export async function setText(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect();
        console.log(chalk.blue(`Setting text content of ${options.selector}`));
        await client.evaluate(`const el = document.querySelector('${options.selector}'); if (el) el.textContent = '${options.value.replace(/'/g, "\\'")}';`);
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