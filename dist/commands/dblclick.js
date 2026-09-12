import { CDPClient } from '../cdp.js';
import { targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile, isRef } from '../utils.js';
import { buildSnapshotLines, anchorRefs, resolveRef } from '../snapshot.js';
export async function dblclick(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect(targetTab(options));
        if (isRef(options.selector)) {
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
            console.log(chalk.blue(`Double-clicking ${options.selector} (${entry.role} "${entry.name}")...`));
            await client.dblclickBackendNode(entry.backendDOMNodeId);
        }
        else {
            console.log(chalk.blue(`Double-clicking ${options.selector}...`));
            await client.dblclick(options.selector);
        }
        console.log(chalk.green('Double-click successful'));
    }
    catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
    }
    finally {
        await client.close();
    }
}
//# sourceMappingURL=dblclick.js.map