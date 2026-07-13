import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface InterceptOptions {
  profile: string;
  url: string;
  action: 'block' | 'mock';
  response?: string;
}

export async function intercept(options: InterceptOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();
    await client.enableNetwork();

    console.log(chalk.blue(`Setting up interception for: ${options.url}`));

    // Store interception config
    const interceptionConfig = {
      urlPattern: options.url,
      action: options.action,
      response: options.response
    };

    // Listen for intercepted requests
    client.onRequestIntercepted(async (intercepted) => {
      const url = intercepted.request.url;

      // Check if URL matches pattern
      if (url.includes(options.url) || new RegExp(options.url).test(url)) {
        console.log(chalk.cyan(`\n⚡ Intercepted: ${url}`));

        if (options.action === 'block') {
          console.log(chalk.red('  → Blocking request'));
          await client.continueInterceptedRequest(intercepted.interceptionId, 'BlockedByClient');
        } else if (options.action === 'mock' && options.response) {
          console.log(chalk.green('  → Mocking response'));
          // For mock, we need to provide the mocked response
          const mockResponse = Buffer.from(options.response).toString('base64');
          await client.send('Network.continueInterceptedRequest', {
            interceptionId: intercepted.interceptionId,
            rawResponse: mockResponse
          });
        } else {
          // Continue normally if no mock response provided
          await client.continueInterceptedRequest(intercepted.interceptionId);
        }
      } else {
        // URL doesn't match, continue normally
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

    // Keep the process running
    process.on('SIGINT', () => {
      console.log(chalk.blue('\n\nStopping interception...'));
      client.close();
      process.exit(0);
    });

    // Prevent process from exiting
    await new Promise(() => {});
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }
}