import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile, buildShadowExpression, buildElementExpression, escapeJsString } from '../utils.js';
import { wantsStructured, renderStructured } from '../output.js';

export interface QueryOptions {
  profile: string;
  selector: string;
  text?: boolean;
  html?: boolean;
  attr?: string;
  count?: boolean;
  exists?: boolean;
  computedStyle?: boolean;
  props?: string;
  json?: boolean;
  yaml?: boolean;
}

/** Parse a comma-separated --props list into a clean array of property names. */
export function parseProps(props?: string): string[] {
  if (!props) return [];
  return props
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function getAccessor(options: QueryOptions): string {
  if (options.text) return 'textContent';
  if (options.attr) return `getAttribute('${escapeJsString(options.attr)}')`;
  return 'outerHTML';
}

export function buildExpression(selector: string, options: QueryOptions): string {
  // Computed styles — works for both native and shadow-piercing selectors.
  // Returns a plain object of { property: value } (or null if not found),
  // which Runtime.evaluate serializes via returnByValue.
  if (options.computedStyle) {
    const el = buildElementExpression(selector);
    const propsList = parseProps(options.props);
    // When specific props are requested, embed them safely; otherwise
    // enumerate every longhand property exposed by the CSSStyleDeclaration.
    const propsExpr = propsList.length > 0
      ? JSON.stringify(propsList)
      : '[...cs]';
    return `(() => { const el = ${el}; if (!el) return null; const cs = getComputedStyle(el); return Object.fromEntries(${propsExpr}.map((p) => [p, cs.getPropertyValue(p)])); })()`;
  }

  // Non-shadow: simple native query
  if (!selector.includes('>>>')) {
    const escaped = escapeJsString(selector);
    if (options.count) {
      return `document.querySelectorAll('${escaped}').length`;
    }
    if (options.exists) {
      return `document.querySelector('${escaped}') !== null`;
    }
    const accessor = getAccessor(options);
    return `document.querySelector('${escaped}')?.${accessor} ?? ''`;
  }

  // Shadow-piercing: build shadow expression
  if (options.count) {
    const parts = selector.split('>>>').map(s => s.trim());
    const last = parts.pop()!;
    let expr = 'document';
    for (const part of parts) {
      expr += `.querySelector('${escapeJsString(part)}')?.shadowRoot`;
    }
    return `(${expr}?.querySelectorAll('${escapeJsString(last)}')?.length ?? 0)`;
  }

  if (options.exists) {
    return `!!(${buildShadowExpression(selector, '')})`;
  }

  return buildShadowExpression(selector, getAccessor(options));
}

function formatOutput(value: unknown, options: QueryOptions): void {
  if (options.count) {
    if (wantsStructured(options)) {
      console.log(renderStructured({ count: value }, options));
    } else {
      console.log(chalk.green(`\n✓ ${value} element(s) found`));
    }
    return;
  }

  if (options.exists) {
    const exists = value === true;
    if (wantsStructured(options)) {
      console.log(renderStructured({ exists }, options));
    } else {
      console.log(exists ? chalk.green('✓ Element exists') : chalk.gray('Element not found'));
    }
    return;
  }

  if (options.computedStyle) {
    if (value === null || value === undefined) {
      if (wantsStructured(options)) {
        console.log(renderStructured(null, options));
      } else {
        console.log(chalk.gray('Element not found'));
      }
      return;
    }
    const styles = value as Record<string, string>;
    if (wantsStructured(options)) {
      console.log(renderStructured(styles, options));
    } else {
      for (const [prop, val] of Object.entries(styles)) {
        console.log(`${chalk.cyan(prop)}: ${val}`);
      }
    }
    return;
  }

  if (wantsStructured(options)) {
    if (options.attr) {
      console.log(renderStructured({ [options.attr]: value }, options));
    } else {
      console.log(renderStructured({ value }, options));
    }
    return;
  }

  if (value === '' || value === null || value === undefined) {
    console.log(chalk.gray('Element not found'));
    return;
  }

  console.log(value);
}

export async function query(options: QueryOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();

    const expression = buildExpression(options.selector, options);
    const result = await client.evaluate(expression);

    if (result.exceptionDetails) {
      console.error(chalk.red(`Runtime error: ${result.exceptionDetails.text}`));
      if (result.exceptionDetails.exception?.description) {
        console.error(chalk.gray(result.exceptionDetails.exception.description));
      }
      process.exit(1);
    }

    formatOutput(result.result?.value, options);
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}