import { CDPClient } from '../cdp.js';
import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile, isRef, buildElementExpression } from '../utils.js';
import { buildSnapshotLines, anchorRefs, resolveRef } from '../snapshot.js';
import { wantsStructured, renderStructured } from '../output.js';

export interface GetHtmlOptions extends TabOptions {
  selector: string;
  profile: string;
  json?: boolean;
  yaml?: boolean;
}

export async function getHtml(options: GetHtmlOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect(targetTab(options));

    let html: string | null = null;

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
      html = result.outerHTML ?? null;
    } else {
      // CSS selector — buildElementExpression handles both plain CSS and `>>>` shadow-pierce
      const result = await client.evaluate(
        `${buildElementExpression(options.selector)}?.outerHTML ?? null`
      );
      html = (result.result?.value as string | null) ?? null;
    }

    if (wantsStructured(options)) {
      console.log(renderStructured({ html }, options));
    } else if (html) {
      console.log(html);
    } else {
      console.log(chalk.gray('Element not found'));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}
