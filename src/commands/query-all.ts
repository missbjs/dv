import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { wantsStructured, renderStructured } from '../output.js';
import { getPortFromProfile, escapeJsString } from '../utils.js';

export interface QueryAllOptions {
  selector: string;
  text?: boolean;
  html?: boolean;
  attr?: string;
  style?: boolean;
  props?: string;
  json?: boolean;
  yaml?: boolean;
  profile: string;
}

/** Parse a comma-separated --props list into a clean array of property names.
 *  Also splits on whitespace to handle PowerShell array-flattening (commas → spaces). */
function parseProps(props?: string): string[] {
  if (!props) return [];
  return props
    .split(/[\s,]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Build a JS expression that resolves to an array of all matching elements,
 * supporting `>>>` shadow piercing. Returns a NodeList-like usable in Array.from.
 */
function buildListExpression(selector: string): string {
  const parts = selector.split('>>>').map((s) => s.trim());
  if (parts.length === 1) {
    return `document.querySelectorAll('${escapeJsString(parts[0])}')`;
  }
  const last = parts.pop()!;
  let expr = 'document';
  for (const part of parts) {
    expr += `.querySelector('${escapeJsString(part)}')?.shadowRoot`;
  }
  return `(${expr}?.querySelectorAll('${escapeJsString(last)}') ?? [])`;
}

/** Build an expression mapping every match to `{ index, value }` (text/html/attr). */
function buildValueAllExpression(selector: string, accessor: string): string {
  const list = buildListExpression(selector);
  return `Array.from(${list}).map((el, i) => ({ index: i, value: el?.${accessor} ?? null }))`;
}

/** Build an expression mapping every match to `{ index, [prop]: value }` computed styles. */
function buildStyleAllExpression(selector: string, propsList: string[]): string {
  const list = buildListExpression(selector);
  const propsExpr = JSON.stringify(propsList.length > 0 ? propsList : ['display']);
  return `(() => { const props = ${propsExpr}; return Array.from(${list}).map((el, i) => { const cs = getComputedStyle(el); const o = { index: i }; props.forEach((p) => { o[p] = cs.getPropertyValue(p); }); return o; }); })()`;
}

export async function queryAll(options: QueryAllOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();

    // Value/style extraction uses Runtime.evaluate (no live node handles needed).
    const accessor = options.text ? 'textContent'
      : options.html ? 'outerHTML'
        : options.attr ? `getAttribute('${escapeJsString(options.attr)}')`
          : options.style ? null
            : null;

    if (accessor !== null) {
      const expression = buildValueAllExpression(options.selector, accessor);
      const result = await client.evaluate(expression);
      if (result.exceptionDetails) {
        console.error(chalk.red(`Runtime error: ${result.exceptionDetails.text}`));
        if (result.exceptionDetails.exception?.description) {
          console.error(chalk.gray(result.exceptionDetails.exception.description));
        }
        process.exit(1);
      }
      const value = result.result?.value;
      if (wantsStructured(options)) {
        console.log(renderStructured(value, options));
      } else {
        for (const item of (value as Array<{ index: number; value: unknown }>) ?? []) {
          console.log(`${chalk.cyan(`[${item.index}]`)}: ${String(item.value)}`);
        }
      }
      return;
    }

    if (options.style) {
      const propsList = parseProps(options.props);
      const expression = buildStyleAllExpression(options.selector, propsList);
      const result = await client.evaluate(expression);
      if (result.exceptionDetails) {
        console.error(chalk.red(`Runtime error: ${result.exceptionDetails.text}`));
        if (result.exceptionDetails.exception?.description) {
          console.error(chalk.gray(result.exceptionDetails.exception.description));
        }
        process.exit(1);
      }
      const styles = result.result?.value;
      if (wantsStructured(options)) {
        console.log(renderStructured(styles, options));
      } else {
        for (const item of (styles as Array<Record<string, unknown>>) ?? []) {
          const { index, ...rest } = item;
          console.log(chalk.cyan(`[${index}]`));
          for (const [prop, val] of Object.entries(rest)) {
            console.log(`  ${chalk.cyan(prop)}: ${val}`);
          }
        }
      }
      return;
    }

    // Default: list node IDs via DOM.querySelectorAll (no shadow piercing).
    console.log(chalk.blue(`Querying: ${options.selector}`));
    const nodeIds = await client.querySelectorAll(options.selector);

    if (wantsStructured(options)) {
      console.log(renderStructured({ count: nodeIds.length, nodeIds }, options));
    } else {
      console.log(chalk.green(`\n✓ Found ${nodeIds.length} element(s)`));
      nodeIds.forEach((id: number, index: number) => {
        console.log(chalk.white(`  ${index + 1}. Node ID: ${id}`));
      });
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}