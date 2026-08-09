import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { wantsStructured, renderStructured } from '../output.js';
import { getPortFromProfile } from '../utils.js';
import { buildSnapshotLines, anchorRefs } from '../snapshot.js';
import { auditA11y, formatA11yReport } from '../a11y.js';
export async function a11y(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect();
        await client.enableAccessibility();
        const axResult = await client.getFullAXTree();
        if (!axResult.nodes || axResult.nodes.length === 0) {
            console.log(chalk.yellow('No accessibility nodes found.'));
            return;
        }
        // Build refs
        const existingRefs = await anchorRefs(client, axResult.nodes);
        const snapshotResult = buildSnapshotLines(axResult.nodes, existingRefs);
        // Build nodeId → ref map for the auditor
        const refMap = new Map();
        for (const [, entry] of snapshotResult.refs) {
            refMap.set(entry.nodeId, entry.ref);
        }
        // Run audit
        const report = auditA11y(axResult.nodes, refMap);
        if (wantsStructured(options)) {
            console.log(renderStructured(report, options));
        }
        else {
            console.log(formatA11yReport(report));
        }
        if (report.summary.errors > 0) {
            process.exit(1);
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
//# sourceMappingURL=a11y.js.map