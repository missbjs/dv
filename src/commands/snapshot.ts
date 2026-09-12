import { CDPClient } from '../cdp.js';
import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
import {
  buildSnapshotLines,
  anchorRefs,
  formatSnapshotLines,
  buildSnapshotJSONObject,
} from '../snapshot.js';
import { wantsStructured, renderStructured } from '../output.js';

export interface SnapshotOptions extends TabOptions {
  profile: string;
  json?: boolean;
  yaml?: boolean;
}

export async function snapshot(options: SnapshotOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect(targetTab(options));

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

    if (wantsStructured(options)) {
      console.log(renderStructured(buildSnapshotJSONObject(result), options));
    } else {
      console.log(formatSnapshotLines(result));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}