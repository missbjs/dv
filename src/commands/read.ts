import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
import { buildSnapshotLines, anchorRefs, formatSnapshotLines } from '../snapshot.js';
import axios from 'axios';

export interface ReadOptions {
  profile: string;
  /** Optional URL to fetch via HTTP instead of reading from the page */
  url?: string;
  /** If true, output the accessibility snapshot text tree */
  snapshot?: boolean;
  /** If true, output the page's body textContent */
  text?: boolean;
}

export async function read(options: ReadOptions) {
  // If a URL is provided, fetch via HTTP
  if (options.url) {
    try {
      const response = await axios.get(options.url, { timeout: 10000, responseType: 'text' });
      console.log(response.data);
      return;
    } catch (error) {
      console.error(chalk.red(`Error fetching URL: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  }

  // Read from the browser page
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();

    if (options.snapshot) {
      // Output accessibility snapshot
      await client.enableAccessibility();
      const axResult = await client.getFullAXTree();
      const existingRefs = await anchorRefs(client, axResult.nodes);
      const result = buildSnapshotLines(axResult.nodes, existingRefs);
      console.log(formatSnapshotLines(result));
    } else if (options.text) {
      // Output page body text
      const result = await client.evaluate('document.body?.textContent || ""');
      console.log(result.result?.value ?? '');
    } else {
      // Default: try to extract readable content (article/main/body)
      const result = await client.evaluate(`
        (() => {
          // Try semantic containers first
          for (const sel of ['article', 'main', '[role="main"]', 'body']) {
            const el = document.querySelector(sel);
            if (el) {
              const text = el.textContent?.trim();
              if (text && text.length > 100) return text;
            }
          }
          return document.body?.textContent?.trim() || '';
        })()
      `);
      const text = result.result?.value ?? '';
      if (text) {
        console.log(text);
      } else {
        console.log(chalk.yellow('No readable content found on the page.'));
      }
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}