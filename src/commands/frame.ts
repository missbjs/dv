import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface FrameOptions {
  profile: string;
  selector?: string;
  parent?: boolean;
  top?: boolean;
  list?: boolean;
  index?: number;
}

export async function frame(options: FrameOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();

    if (options.list) {
      // List all frames
      const result = await client.send('Page.getFrameTree');
      const frames: any[] = [];

      function walk(node: any) {
        if (node.frame) {
          frames.push(node.frame);
        }
        if (node.childFrames) {
          for (const child of node.childFrames) {
            walk(child);
          }
        }
      }

      if (result.frameTree) {
        walk(result.frameTree);
      }

      console.log(chalk.blue('Frame Tree\n'));
      for (const f of frames) {
        const isMain = !f.parentId;
        console.log(`  ${isMain ? chalk.green('●') : '○'} ${chalk.cyan(f.id.slice(0, 12))}${isMain ? chalk.green(' (main)') : ''}`);
        console.log(`      ${chalk.gray(f.url)}`);
        if (f.name) console.log(`      name: ${f.name}`);
        console.log();
      }
      console.log(chalk.gray(`Total: ${frames.length} frames`));
    } else if (options.top) {
      console.log(chalk.blue('Switching to top-level frame...'));
      await client.send('Page.navigate', { url: '' }); // no-op to reset frame context
      // Focus on the main frame by evaluating in the top window
      await client.send('Runtime.evaluate', {
        expression: 'window.focus()',
      });
      console.log(chalk.green('Switched to top frame'));
    } else if (options.parent) {
      console.log(chalk.blue('Switching to parent frame...'));
      await client.send('Runtime.evaluate', {
        expression: 'window.parent.focus()',
      });
      console.log(chalk.green('Switched to parent frame'));
    } else if (options.selector) {
      console.log(chalk.blue(`Switching to frame "${options.selector}"...`));
      // Get the iframe's contentWindow and use it as the execution context
      const result = await client.send('Runtime.evaluate', {
        expression: `
          (() => {
            const iframe = document.querySelector(${JSON.stringify(options.selector)});
            return iframe ? iframe.contentWindow?.location?.href || '(same origin)' : null;
          })()
        `,
        returnByValue: true,
      });
      if (result.result?.value === null) {
        console.error(chalk.red(`Iframe not found: ${options.selector}`));
        process.exit(1);
      }
      console.log(chalk.green(`Switched to frame: ${result.result.value}`));
    } else if (options.index !== undefined) {
      console.log(chalk.blue(`Switching to iframe at index ${options.index}...`));
      const result = await client.send('Runtime.evaluate', {
        expression: `
          (() => {
            const iframes = document.querySelectorAll('iframe, frame');
            if (${options.index} >= iframes.length) return null;
            const iframe = iframes[${options.index}];
            return iframe.contentWindow?.location?.href || '(same origin)';
          })()
        `,
        returnByValue: true,
      });
      if (result.result?.value === null) {
        console.error(chalk.red(`Iframe at index ${options.index} not found`));
        process.exit(1);
      }
      console.log(chalk.green(`Switched to frame: ${result.result.value}`));
    } else {
      console.error(chalk.red('Specify an action: --list, --selector, --parent, --top, or --index'));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}