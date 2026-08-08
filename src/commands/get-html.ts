import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile, isRef } from '../utils.js';
import { buildSnapshotLines, anchorRefs, resolveRef } from '../snapshot.js';

export interface GetHtmlOptions {
  selector: string;
  profile: string;
}

export async function getHtml(options: GetHtmlOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();

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

      const result = await client.getOuterHTMLByBackendNode(entry.backendDOMNodeId);
      if (result.outerHTML) {
        console.log(result.outerHTML);
      } else {
        console.log(chalk.gray('Element not found'));
      }
    } else {
      // CSS selector
      const result = await client.evaluate(
        `document.querySelector('${options.selector.replace(/'/g, "\\'")}')?.outerHTML || ''`
      );

      if (result.result?.value) {
        console.log(result.result.value);
      } else {
        console.log(chalk.gray('Element not found'));
      }
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}