import { CDPClient } from '../cdp.js';
import { targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
import { wantsStructured, renderStructured } from '../output.js';
export async function clipboard(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect(targetTab(options));
        switch (options.action) {
            case 'read': {
                const text = await client.clipboardReadText();
                if (wantsStructured(options)) {
                    console.log(renderStructured({ text }, options));
                }
                else {
                    console.log(text || chalk.gray('(empty clipboard)'));
                }
                break;
            }
            case 'write': {
                if (!options.text) {
                    console.error(chalk.red('--text is required for write action'));
                    process.exit(1);
                }
                await client.clipboardWriteText(options.text);
                console.log(chalk.green('Clipboard written'));
                break;
            }
            case 'copy': {
                await client.clipboardCopy();
                console.log(chalk.green('Copied (Ctrl+C)'));
                break;
            }
            case 'paste': {
                await client.clipboardPaste();
                console.log(chalk.green('Pasted (Ctrl+V)'));
                break;
            }
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
//# sourceMappingURL=clipboard.js.map