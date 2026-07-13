import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface InspectOptions {
  profile: string;
  selector: string;
  json?: boolean;
}

export async function inspect(options: InspectOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();

    console.log(chalk.blue(`Inspecting: ${options.selector}`));
    const element = await client.inspectElement(options.selector);

    if (options.json) {
      console.log(JSON.stringify(element, null, 2));
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
        console.log(chalk.white(`  Width: ${element.box.width}px`));
        console.log(chalk.white(`  Height: ${element.box.height}px`));
      }
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}