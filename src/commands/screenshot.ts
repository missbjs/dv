import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import { getPortFromProfile } from '../utils.js';

export interface ScreenshotOptions {
  profile: string;
  output: string;
}

export async function screenshot(options: ScreenshotOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();
    await client.enablePage();

    console.log(chalk.blue('Taking screenshot...'));
    const result = await client.takeScreenshot();

    if (result.data) {
      const buffer = Buffer.from(result.data, 'base64');
      await fs.writeFile(options.output, buffer);

      console.log(chalk.green(`Screenshot saved to ${options.output}`));
      console.log(chalk.gray(`Size: ${buffer.length} bytes`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}