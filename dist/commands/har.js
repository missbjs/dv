import { targetTab } from '../tab.js';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import { ensureNetworkRecorder, historyTab } from '../network-recorder.js';
import { recorderCall } from '../network-service.js';
const headers = (input = {}) => Object.entries(input).map(([name, value]) => ({ name, value }));
export async function har(options) {
    try {
        await ensureNetworkRecorder(options.profile);
        const tabId = await historyTab(options.profile, targetTab(options));
        const { entries } = await recorderCall(options.profile, 'export', { tabId });
        const harLog = { log: { version: '1.2', creator: { name: 'dv CLI', version: '1' }, entries: entries.map(entry => {
                    const duration = entry.endTimestamp === undefined ? 0 : Math.max(0, (entry.endTimestamp - entry.timestamp) * 1000);
                    let queryString = [];
                    try {
                        queryString = [...new URL(entry.url).searchParams].map(([name, value]) => ({ name, value }));
                    }
                    catch { }
                    const body = entry.body;
                    return {
                        startedDateTime: new Date(entry.wallTime * 1000).toISOString(), time: duration,
                        request: { method: entry.method, url: entry.url, httpVersion: entry.protocol ?? '', headers: headers(entry.requestHeaders), queryString, cookies: [], headersSize: -1,
                            bodySize: entry.postData === undefined ? -1 : Buffer.byteLength(entry.postData),
                            ...(entry.postData === undefined ? {} : { postData: { mimeType: entry.requestHeaders['Content-Type'] ?? 'application/octet-stream', text: entry.postData } }) },
                        response: { status: entry.status ?? 0, statusText: entry.statusText ?? '', httpVersion: entry.protocol ?? '', headers: headers(entry.responseHeaders), cookies: [],
                            content: { size: body ? Buffer.byteLength(body.body, body.base64Encoded ? 'base64' : 'utf8') : -1, mimeType: entry.mimeType ?? '',
                                ...(body ? { text: body.body, ...(body.base64Encoded ? { encoding: 'base64' } : {}) } : {}) },
                            redirectURL: entry.responseHeaders?.['Location'] ?? entry.responseHeaders?.['location'] ?? '', headersSize: -1, bodySize: entry.encodedDataLength ?? -1 },
                        cache: {}, timings: { send: 0, wait: duration, receive: 0 },
                        _dv: { id: entry.id, tabId: entry.tabId, targetId: entry.targetId, loaderId: entry.loaderId, state: entry.state, errorText: entry.errorText, bodyState: entry.bodyState, timing: entry.timing },
                    };
                }) } };
        await fs.writeFile(options.output, JSON.stringify(harLog, null, 2), 'utf-8');
        console.log(chalk.green(`HAR file saved to ${options.output}`));
        console.log(chalk.gray(`Entries: ${entries.length}`));
    }
    catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exitCode = 1;
    }
}
//# sourceMappingURL=har.js.map