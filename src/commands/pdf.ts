import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
import fs from 'fs';
import path from 'path';

export interface PdfOptions {
  profile: string;
  output?: string;
  landscape?: boolean;
  printBackground?: boolean;
  paperWidth?: number;
  paperHeight?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  pageRanges?: string;
  preferCSSPageSize?: boolean;
}

export async function pdf(options: PdfOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();

    console.log(chalk.blue('Generating PDF...'));
    const data = await client.printToPDF({
      landscape: options.landscape,
      printBackground: options.printBackground,
      paperWidth: options.paperWidth,
      paperHeight: options.paperHeight,
      marginTop: options.marginTop,
      marginBottom: options.marginBottom,
      marginLeft: options.marginLeft,
      marginRight: options.marginRight,
      pageRanges: options.pageRanges,
      preferCSSPageSize: options.preferCSSPageSize,
    });

    const outputPath = options.output || 'page.pdf';
    const resolved = path.resolve(outputPath);
    fs.writeFileSync(resolved, Buffer.from(data, 'base64'));
    console.log(chalk.green(`PDF saved to ${resolved}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}