import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
import { buildSnapshotLines, anchorRefs, formatSnapshotLines, formatSnapshotJSON, } from '../snapshot.js';
export async function snapshot(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect();
        // Enable accessibility domain
        await client.enableAccessibility();
        // Get the full accessibility tree
        const axResult = await client.getFullAXTree();
        if (!axResult.nodes || axResult.nodes.length === 0) {
            console.log(chalk.yellow('No accessibility nodes found. The page may be empty.'));
            return;
        }
        // Anchor refs: read existing data-dv-ref, assign new ones
        const existingRefs = await anchorRefs(client, axResult.nodes);
        // Build snapshot lines from the anchored tree
        const result = buildSnapshotLines(axResult.nodes, existingRefs);
        if (options.json) {
            console.log(formatSnapshotJSON(result));
        }
        else {
            console.log(formatSnapshotLines(result));
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
//# sourceMappingURL=snapshot.js.map