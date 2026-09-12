import { CDPClient } from '../cdp.js';
import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { wantsStructured, renderStructured } from '../output.js';
import { getPortFromProfile, isRef } from '../utils.js';
import { buildSnapshotLines, anchorRefs, resolveRef } from '../snapshot.js';

export interface InspectOptions extends TabOptions {
  profile: string;
  selector: string;
  json?: boolean;
  yaml?: boolean;
}

export async function inspect(options: InspectOptions) {
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

      console.log(chalk.blue(`Inspecting: ${options.selector} (${entry.role} "${entry.name}")`));
      const element = await client.inspectBackendNode(entry.backendDOMNodeId);

      if (wantsStructured(options)) {
        console.log(renderStructured({ ...element, ref: options.selector, role: entry.role, name: entry.name }, options));
      } else {
        console.log(chalk.green('\n✓ Element found'));
        console.log(chalk.gray(`Ref: ${options.selector}`));
        console.log(chalk.gray(`Role: ${entry.role}`));
        console.log(chalk.gray(`Name: "${entry.name}"`));
        console.log(chalk.gray(`Node ID: ${element.nodeId}`));

        if (element.attributes && element.attributes.length > 0) {
          console.log(chalk.gray('\nAttributes:'));
          for (let i = 0; i < element.attributes.length; i += 2) {
            console.log(chalk.white(`  ${element.attributes[i]}="${element.attributes[i + 1]}"`));
          }
        }

        if (element.box) {
          console.log(chalk.gray('\nBox Model:'));
          const width = element.box.width ?? Math.abs(element.box.content[2] - element.box.content[0]);
          const height = element.box.height ?? Math.abs(element.box.content[5] - element.box.content[1]);
          console.log(chalk.white(`  Width: ${width}px`));
          console.log(chalk.white(`  Height: ${height}px`));
        }
      }
    } else {
      // CSS selector
      console.log(chalk.blue(`Inspecting: ${options.selector}`));
      const element = await client.inspectElement(options.selector);

      if (wantsStructured(options)) {
        console.log(renderStructured(element, options));
      } else {
        console.log(chalk.green('\n✓ Element found'));
        console.log(chalk.gray(`Node ID: ${element.nodeId}`));

        if (element.attributes && element.attributes.length > 0) {
          console.log(chalk.gray('\nAttributes:'));
          for (let i = 0; i < element.attributes.length; i += 2) {
            console.log(chalk.white(`  ${element.attributes[i]}="${element.attributes[i + 1]}"`));
          }
        }

        if (element.box) {
          console.log(chalk.gray('\nBox Model:'));
          const width = element.box.width ?? Math.abs(element.box.content[2] - element.box.content[0]);
          const height = element.box.height ?? Math.abs(element.box.content[5] - element.box.content[1]);
          console.log(chalk.white(`  Width: ${width}px`));
          console.log(chalk.white(`  Height: ${height}px`));
        }
      }
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}