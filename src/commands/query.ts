import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile, buildShadowExpression, escapeJsString } from '../utils.js';

export interface QueryOptions {
  profile: string;
  selector: string;
  text?: boolean;
  html?: boolean;
  attr?: string;
  count?: boolean;
  exists?: boolean;
  json?: boolean;
}

function getAccessor(options: QueryOptions): string {
  if (options.text) return 'textContent';
  if (options.attr) return `getAttribute('${escapeJsString(options.attr)}')`;
  return 'outerHTML';
}

export function buildExpression(selector: string, options: QueryOptions): string {
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
    if (options.json) {
      console.log(JSON.stringify({ count: value }, null, 2));
    } else {
      console.log(chalk.green(`\n✓ ${value} element(s) found`));
    }
    return;
  }

  if (options.exists) {
    const exists = value === true;
    if (options.json) {
      console.log(JSON.stringify({ exists }, null, 2));
    } else {
      console.log(exists ? chalk.green('✓ Element exists') : chalk.gray('Element not found'));
    }
    return;
  }

  if (options.json) {
    if (options.attr) {
      console.log(JSON.stringify({ [options.attr]: value }, null, 2));
    } else {
      console.log(JSON.stringify({ value }, null, 2));
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