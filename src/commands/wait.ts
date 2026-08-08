import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile, isRef } from '../utils.js';
import { buildSnapshotLines, anchorRefs, resolveRef } from '../snapshot.js';

export interface WaitOptions {
  profile: string;
  load?: boolean;
  domcontentloaded?: boolean;
  networkidle?: boolean;
  selector?: string;
  text?: string;
  timeout?: number;   // max wait ms (default 30000)
  ms?: number;        // positional: simple sleep
}

export async function wait(options: WaitOptions) {
  const maxWait = options.timeout ?? 30000;
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();

    // Infer mode from which option was provided
    if (options.load) {
      console.log(chalk.blue('Waiting for page load event...'));
      await client.enablePage();
      await waitForLoadEvent(client, maxWait);
      console.log(chalk.green('Page loaded'));
    } else if (options.domcontentloaded) {
      console.log(chalk.blue('Waiting for DOMContentLoaded...'));
      await client.enablePage();
      await waitForDOMContentLoaded(client, maxWait);
      console.log(chalk.green('DOM content loaded'));
    } else if (options.networkidle) {
      console.log(chalk.blue('Waiting for network idle...'));
      await client.enableNetwork();
      await waitForNetworkIdle(client, maxWait);
      console.log(chalk.green('Network idle'));
    } else if (options.selector) {
      console.log(chalk.blue(`Waiting for selector "${options.selector}"...`));
      if (isRef(options.selector)) {
        await client.enableAccessibility();
        await waitForRef(client, options.selector, maxWait);
      } else {
        await waitForSelector(client, options.selector, maxWait);
      }
      console.log(chalk.green(`Found: ${options.selector}`));
    } else if (options.text) {
      console.log(chalk.blue(`Waiting for text "${options.text}"...`));
      await waitForText(client, options.text, maxWait);
      console.log(chalk.green(`Text found: "${options.text}"`));
    } else if (options.ms != null) {
      console.log(chalk.blue(`Waiting ${options.ms}ms...`));
      await sleep(options.ms);
      console.log(chalk.green('Done waiting'));
    } else {
      console.error(chalk.red('Specify a condition: --load, --domcontentloaded, --networkidle, --selector, --text, or a timeout in ms'));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}

async function waitForLoadEvent(client: CDPClient, maxWait: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = (client as any).ws;
    if (!ws) { reject(new Error('Not connected')); return; }

    const timer = setTimeout(() => reject(new Error('Timeout waiting for page load')), maxWait);

    const handler = (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.method === 'Page.loadEventFired') {
          clearTimeout(timer);
          ws.removeListener('message', handler);
          resolve();
        }
      } catch {}
    };

    ws.on('message', handler);
    client.send('Page.reload').catch(() => {});
  });
}

async function waitForDOMContentLoaded(client: CDPClient, maxWait: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = (client as any).ws;
    if (!ws) { reject(new Error('Not connected')); return; }

    const timer = setTimeout(() => reject(new Error('Timeout waiting for DOMContentLoaded')), maxWait);

    const handler = (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.method === 'Page.domContentEventFired') {
          clearTimeout(timer);
          ws.removeListener('message', handler);
          resolve();
        }
      } catch {}
    };

    ws.on('message', handler);
    client.send('Page.reload').catch(() => {});
  });
}

async function waitForNetworkIdle(client: CDPClient, maxWait: number): Promise<void> {
  const idleTime = 500;
  let lastActivity = Date.now();
  let activeRequests = 0;

  const ws = (client as any).ws;
  if (!ws) throw new Error('Not connected');

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.removeListener('message', handler);
      clearInterval(interval);
      reject(new Error('Timeout waiting for network idle'));
    }, maxWait);

    const handler = (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.method === 'Network.requestWillBeSent') {
          activeRequests++;
          lastActivity = Date.now();
        } else if (msg.method === 'Network.responseReceived') {
          activeRequests = Math.max(0, activeRequests - 1);
          lastActivity = Date.now();
        } else if (msg.method === 'Network.loadingFinished') {
          activeRequests = Math.max(0, activeRequests - 1);
        }
      } catch {}
    };

    ws.on('message', handler);

    const interval = setInterval(() => {
      if (activeRequests <= 0 && Date.now() - lastActivity >= idleTime) {
        clearTimeout(timer);
        clearInterval(interval);
        ws.removeListener('message', handler);
        resolve();
      }
    }, 100);
  });
}

async function waitForSelector(client: CDPClient, selector: string, maxWait: number): Promise<void> {
  const pollInterval = 200;
  const deadline = Date.now() + maxWait;

  while (Date.now() < deadline) {
    try {
      const result = await client.evaluate(
        `!!document.querySelector('${selector.replace(/'/g, "\\'")}')`
      );
      if (result.result?.value === true) return;
    } catch {}
    await sleep(pollInterval);
  }
  throw new Error(`Timeout waiting for selector: ${selector}`);
}

async function waitForRef(client: CDPClient, ref: string, maxWait: number): Promise<void> {
  const pollInterval = 200;
  const deadline = Date.now() + maxWait;

  while (Date.now() < deadline) {
    try {
      const axResult = await client.getFullAXTree();
      const existingRefs = await anchorRefs(client, axResult.nodes);
      const result = buildSnapshotLines(axResult.nodes, existingRefs);
      if (result.refs.has(ref)) return;
    } catch {}
    await sleep(pollInterval);
  }
  throw new Error(`Timeout waiting for ref: ${ref}`);
}

async function waitForText(client: CDPClient, text: string, maxWait: number): Promise<void> {
  const pollInterval = 200;
  const deadline = Date.now() + maxWait;
  const lowerText = text.toLowerCase();

  while (Date.now() < deadline) {
    try {
      const result = await client.evaluate(`document.body?.textContent || ''`);
      if (result.result?.value?.toLowerCase().includes(lowerText)) return;
    } catch {}
    await sleep(pollInterval);
  }
  throw new Error(`Timeout waiting for text: "${text}"`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}