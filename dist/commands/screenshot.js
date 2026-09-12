import { CDPClient } from '../cdp.js';
import { targetTab } from '../tab.js';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import { getPortFromProfile } from '../utils.js';
export async function screenshot(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect(targetTab(options));
        await client.enablePage();
        let data;
        if (options.selector) {
            console.log(chalk.blue(`Taking screenshot of element "${options.selector}"...`));
            const box = await client.getBoxModelBySelector(options.selector);
            const result = await client.captureScreenshotWithClip({
                x: box.content[0],
                y: box.content[1],
                width: box.content[2] - box.content[0],
                height: box.content[5] - box.content[1],
            });
            data = result.data;
        }
        else {
            console.log(chalk.blue('Taking screenshot...'));
            const result = await client.takeScreenshot();
            data = result.data;
        }
        if (data) {
            const buffer = Buffer.from(data, 'base64');
            await fs.writeFile(options.output, buffer);
            console.log(chalk.green(`Screenshot saved to ${options.output}`));
            console.log(chalk.gray(`Size: ${buffer.length} bytes`));
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
//# sourceMappingURL=screenshot.js.map