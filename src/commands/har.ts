import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import { getPortFromProfile } from '../utils.js';

export interface HarOptions {
  profile: string;
  output: string;
}

export async function har(options: HarOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect();
    await client.enableNetwork();

    console.log(chalk.blue('Collecting network activity for HAR export...'));

    // Get all network entries from the client's collected events
    const entries = (client as any).networkEvents || [];
    const promises = entries.map(async (entry: any) => {
      try {
        if (entry.requestId) {
          const body = await client.send('Network.getResponseBody', {
            requestId: entry.requestId,
          }).catch(() => null);
          return { ...entry, body };
        }
      } catch {}
      return entry;
    });

    const resolved = await Promise.all(promises);

    // Build HAR structure
    const harLog = {
      log: {
        version: '1.2',
        creator: { name: 'dv CLI', version: '1.0.0' },
        entries: resolved.map((entry: any) => ({
          startedDateTime: entry.timestamp
            ? new Date(entry.timestamp * 1000).toISOString()
            : new Date().toISOString(),
          request: {
            method: entry.request?.method || 'GET',
            url: entry.request?.url || entry.url || '',
            httpVersion: 'HTTP/1.1',
            headers: entry.request?.headers || [],
            queryString: [],
            cookies: [],
            headersSize: -1,
            bodySize: entry.request?.postData?.length || -1,
          },
          response: {
            status: entry.response?.status || 0,
            statusText: entry.response?.statusText || '',
            httpVersion: 'HTTP/1.1',
            headers: entry.response?.headers || [],
            cookies: [],
            content: {
              size: entry.response?.headersText?.length || 0,
              mimeType: entry.response?.mimeType || 'text/plain',
              text: entry.body?.body || undefined,
            },
            redirectURL: '',
            headersSize: -1,
            bodySize: -1,
          },
          cache: {},
          timings: {
            send: 0,
            wait: 0,
            receive: entry.duration || 0,
          },
          time: entry.duration || 0,
        })),
        pages: [
          {
            startedDateTime: new Date().toISOString(),
            id: 'page_1',
            title: '',
            pageTimings: { onContentLoad: -1, onLoad: -1 },
          },
        ],
      },
    };

    const json = JSON.stringify(harLog, null, 2);
    await fs.writeFile(options.output, json, 'utf-8');

    console.log(chalk.green(`HAR file saved to ${options.output}`));
    console.log(chalk.gray(`Entries: ${harLog.log.entries.length}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}