import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
import { resolve } from 'path';

export interface UploadOptions {
  profile: string;
  selector: string;
  files: string[];
}

export async function upload(options: UploadOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();
    const resolvedPaths = options.files.map((f: string) => resolve(f));
    console.log(chalk.blue(`Uploading files to "${options.selector}":`));
    for (const fp of resolvedPaths) {
      console.log(chalk.gray(`  - ${fp}`));
    }
    await client.setFileInputFilesBySelector(options.selector, resolvedPaths);
    console.log(chalk.green('Upload successful'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}