import { CDPClient } from '../cdp.js';
import { targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
import { wantsStructured, renderStructured } from '../output.js';
export async function getBox(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect(targetTab(options));
        const box = await client.getBoxModelBySelector(options.selector);
        const result = {
            x: box.content[0],
            y: box.content[1],
            width: box.content[2] - box.content[0],
            height: box.content[5] - box.content[1],
            content: box.content,
            padding: box.padding,
            border: box.border,
            margin: box.margin,
        };
        if (wantsStructured(options)) {
            console.log(renderStructured(result, options));
        }
        else {
            console.log(chalk.cyan(`Box model for "${options.selector}":`));
            console.log(`  Position: (${result.x}, ${result.y})`);
            console.log(`  Size: ${result.width} × ${result.height}`);
            console.log(`  Content: ${JSON.stringify(result.content)}`);
            console.log(`  Padding: ${JSON.stringify(result.padding)}`);
            console.log(`  Border: ${JSON.stringify(result.border)}`);
            console.log(`  Margin: ${JSON.stringify(result.margin)}`);
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
//# sourceMappingURL=get-box.js.map