import { CDPClient } from '../cdp.js';
import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile, isRef } from '../utils.js';
import { buildSnapshotLines, anchorRefs, resolveRef } from '../snapshot.js';

export interface ToggleOptions extends TabOptions {
  profile: string;
  selector: string;
}

async function toggle(options: ToggleOptions, checked: boolean) {
  const client = new CDPClient(getPortFromProfile(options.profile));
  const verb = checked ? 'Checking' : 'Unchecking';

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

      console.log(chalk.blue(`${verb} ${options.selector} (${entry.role} "${entry.name}")...`));

      // Resolve backend node → frontend, then set checked via Runtime.callFunctionOn
      const { nodeIds } = await client.pushNodesByBackendIdsToFrontend([entry.backendDOMNodeId]);
      const nodeId = nodeIds?.[0];
      if (nodeId === undefined) {
        console.error(chalk.red(`Cannot resolve backend DOM node: ${entry.backendDOMNodeId}`));
        process.exit(1);
      }
      const resolved = await client.send('DOM.resolveNode', { nodeId });
      const objectId = resolved.object?.objectId;
      if (!objectId) {
        console.error(chalk.red(`Cannot resolve DOM node object: ${nodeId}`));
        process.exit(1);
      }
      await client.send('Runtime.callFunctionOn', {
        objectId,
        functionDeclaration: `function(checked) {
          this.checked = checked;
          this.dispatchEvent(new Event('change', { bubbles: true }));
        }`,
        arguments: [{ value: checked }],
        returnByValue: true,
      });
    } else {
      console.log(chalk.blue(`${verb} ${options.selector}...`));
      if (checked) {
        await client.check(options.selector);
      } else {
        await client.uncheck(options.selector);
      }
    }

    console.log(chalk.green(`${checked ? 'Checked' : 'Unchecked'}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}

export async function check(options: ToggleOptions) {
  await toggle(options, true);
}

export async function uncheck(options: ToggleOptions) {
  await toggle(options, false);
}