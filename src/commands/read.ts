import { CDPClient } from '../cdp.js';
import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile, buildElementExpression } from '../utils.js';
import { buildSnapshotLines, anchorRefs, formatSnapshotLines, buildSnapshotJSONObject } from '../snapshot.js';
import { wantsStructured, renderStructured } from '../output.js';
import axios from 'axios';

export interface ReadOptions extends TabOptions {
  profile: string;
  /** Optional CSS selector (supports >>>) to scope --html / --text output */
  selector?: string;
  /** Optional URL to fetch via HTTP instead of reading from the page */
  url?: string;
  /** If true, output the accessibility snapshot text tree */
  snapshot?: boolean;
  /** If true, output the page's body textContent */
  text?: boolean;
  /** If true, output HTML (whole document, or the element when a selector is given) */
  html?: boolean;
  /** Alias for --html */
  dom?: boolean;
  json?: boolean;
  yaml?: boolean;
}

export async function read(options: ReadOptions) {
  const wantsHtml = options.html || options.dom;

  // If a URL is provided, fetch via HTTP
  if (options.url) {
    try {
      const response = await axios.get(options.url, { timeout: 10000, responseType: 'text' });
      const body = typeof response.data === 'string' ? response.data : String(response.data);
      if (wantsStructured(options)) {
        console.log(renderStructured({ url: options.url, body }, options));
      } else {
        console.log(body);
      }
      return;
    } catch (error) {
      console.error(chalk.red(`Error fetching URL: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  }

  // Read from the browser page
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect(targetTab(options));

    if (options.snapshot) {
      // Output accessibility snapshot
      await client.enableAccessibility();
      const axResult = await client.getFullAXTree();
      const existingRefs = await anchorRefs(client, axResult.nodes);
      const result = buildSnapshotLines(axResult.nodes, existingRefs);
      if (wantsStructured(options)) {
        console.log(renderStructured(buildSnapshotJSONObject(result), options));
      } else {
        console.log(formatSnapshotLines(result));
      }
    } else if (wantsHtml) {
      // Output HTML: whole document, or a specific element when a selector is given
      const expr = options.selector
        ? `${buildElementExpression(options.selector)}?.outerHTML ?? null`
        : 'document.documentElement.outerHTML';
      const result = await client.evaluate(expr);
      const html = (result.result?.value as string | null) ?? null;
      if (wantsStructured(options)) {
        console.log(renderStructured({ html }, options));
      } else if (html) {
        console.log(html);
      } else {
        console.log(chalk.yellow(options.selector ? 'Element not found.' : 'No HTML content found.'));
      }
    } else if (options.text) {
      // Output text: whole body, or a specific element when a selector is given
      const expr = options.selector
        ? `${buildElementExpression(options.selector)}?.textContent ?? ''`
        : 'document.body?.textContent || ""';
      const result = await client.evaluate(expr);
      const text = (result.result?.value as string) ?? '';
      if (wantsStructured(options)) {
        console.log(renderStructured({ text }, options));
      } else {
        console.log(text);
      }
    } else {
      // Default: try to extract readable content (article/main/body)
      const scope = options.selector
        ? `[${buildElementExpression(options.selector)}].filter(Boolean)`
        : `['article', 'main', '[role="main"]', 'body'].map((sel) => document.querySelector(sel))`;
      const result = await client.evaluate(`
        (() => {
          for (const el of ${scope}) {
            if (el) {
              const text = el.textContent?.trim();
              if (text && text.length > 100) return text;
            }
          }
          return document.body?.textContent?.trim() || '';
        })()
      `);
      const text = (result.result?.value as string) ?? '';
      if (wantsStructured(options)) {
        console.log(renderStructured({ text }, options));
      } else if (text) {
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
