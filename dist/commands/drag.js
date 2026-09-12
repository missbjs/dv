import { CDPClient } from '../cdp.js';
import { targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
export async function drag(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect(targetTab(options));
        // Parse target: either a CSS selector or "x=100,y=200" format
        let targetPos;
        const xyMatch = options.target.match(/^x=(\d+(?:\.\d+)?),y=(\d+(?:\.\d+)?)$/i);
        if (xyMatch) {
            targetPos = { x: parseFloat(xyMatch[1]), y: parseFloat(xyMatch[2]) };
            console.log(chalk.blue(`Dragging "${options.source}" to coordinates (${targetPos.x}, ${targetPos.y})...`));
        }
        else {
            targetPos = options.target;
            console.log(chalk.blue(`Dragging "${options.source}" to "${options.target}"...`));
        }
        await client.dragAndDrop(options.source, targetPos);
        console.log(chalk.green('Drag and drop successful'));
    }
    catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
    }
    finally {
        await client.close();
    }
}
//# sourceMappingURL=drag.js.map