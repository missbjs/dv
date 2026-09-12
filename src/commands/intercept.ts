import { CDPClient } from '../cdp.js';
import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface InterceptOptions extends TabOptions {
  profile: string;
  url: string;
  action: 'block' | 'mock';
  response?: string;
}

export async function intercept(options: InterceptOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));
  let isClosing = false;

  try {
    await client.connect(targetTab(options));
    await client.enableNetwork();

    console.log(chalk.blue(`Setting up interception for: ${options.url}`));

    // Listen for intercepted requests
    client.onRequestIntercepted(async (intercepted) => {
      // Skip if we're shutting down (CR-17 / WR-17)
      if (isClosing) return;

      const url = intercepted.request.url;

      // Check if URL matches pattern
      if (url.includes(options.url) || new RegExp(options.url).test(url)) {
        console.log(chalk.cyan(`\n⚡ Intercepted: ${url}`));

        if (options.action === 'block') {
          console.log(chalk.red('  → Blocking request'));
          await client.continueInterceptedRequest(intercepted.interceptionId, 'BlockedByClient');
        } else if (options.action === 'mock' && options.response) {
          console.log(chalk.green('  → Mocking response'));
          const mockResponse = Buffer.from(options.response).toString('base64');
          await client.send('Network.continueInterceptedRequest', {
            interceptionId: intercepted.interceptionId,
            rawResponse: mockResponse
          });
        } else {
          await client.continueInterceptedRequest(intercepted.interceptionId);
        }
      } else {
        await client.continueInterceptedRequest(intercepted.interceptionId);
      }
    });

    // Enable request interception
    await client.setRequestInterception([{ urlPattern: '*', interceptionStage: 'Request' }]);

    if (options.action === 'block') {
      console.log(chalk.green('✓ Blocking requests matching: ' + options.url));
    } else if (options.action === 'mock') {
      console.log(chalk.green('✓ Mocking requests matching: ' + options.url));
      if (options.response) {
        console.log(chalk.gray('Response: ' + options.response.substring(0, 100)));
      }
    }

    console.log(chalk.yellow('\nListening for requests... Press Ctrl+C to stop'));
    console.log(chalk.gray('Interception will remain active until you stop this command'));

    // Use a deferred promise that resolves on SIGINT (CR-07)
    const deferred = defer<void>();
    const onSigint = () => {
      isClosing = true;
      console.log(chalk.blue('\n\nStopping interception...'));
      deferred.resolve();
    };
    process.on('SIGINT', onSigint);

    await deferred.promise;

    process.removeListener('SIGINT', onSigint);
    await client.close();
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }
}

/** Create a deferred promise (resolvable from outside) */
function defer<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (reason?: any) => void } {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}