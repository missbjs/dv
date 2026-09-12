import { CDPClient } from '../cdp.js';
import { targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile, isRef } from '../utils.js';
import { buildSnapshotLines, anchorRefs, resolveRef } from '../snapshot.js';
export async function type(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect(targetTab(options));
        if (isRef(options.selector)) {
            // @e ref — resolve via snapshot
            await client.enableAccessibility();
            const axResult = await client.getFullAXTree();
            const existingRefs = await anchorRefs(client, axResult.nodes);
            const snapshotResult = buildSnapshotLines(axResult.nodes, existingRefs);
            const entry = resolveRef(options.selector, snapshotResult);
            if (!entry) {
                console.error(chalk.red(`Ref not found: ${options.selector}`));
                process.exit(1);
            }
            if (entry.backendDOMNodeId === undefined) {
                console.error(chalk.red(`Ref ${options.selector} has no DOM node`));
                process.exit(1);
            }
            console.log(chalk.blue(`Typing "${options.text}" into ${options.selector} (${entry.role} "${entry.name}")...`));
            await client.typeBackendNode(entry.backendDOMNodeId, options.text);
        }
        else {
            // CSS selector
            console.log(chalk.blue(`Typing "${options.text}" into ${options.selector}...`));
            await client.type(options.selector, options.text);
        }
        console.log(chalk.green('Type successful'));
    }
    catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
    }
    finally {
        await client.close();
    }
}
//# sourceMappingURL=type.js.map