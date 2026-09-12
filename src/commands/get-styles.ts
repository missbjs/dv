import { CDPClient } from '../cdp.js';
import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
import { wantsStructured, renderStructured } from '../output.js';

export interface GetStylesOptions extends TabOptions {
  profile: string;
  selector: string;
  props?: string;
  json?: boolean;
  yaml?: boolean;
}

export async function getStyles(options: GetStylesOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect(targetTab(options));

    const propsList = options.props
      ? options.props.split(/[\s,]+/).map(p => p.trim()).filter(Boolean)
      : undefined;

    const styles = await client.getElementStyles(options.selector, propsList);

    if (styles === null) {
      console.error(chalk.red(`Element not found: ${options.selector}`));
      process.exit(1);
    }

    if (wantsStructured(options)) {
      console.log(renderStructured(styles, options));
    } else {
      for (const [prop, val] of Object.entries(styles)) {
        console.log(`${chalk.cyan(prop)}: ${val}`);
      }
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}