import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { CDPClient } from '../cdp.js';
import { targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
/**
 * One process, one CDP session: arm Network, run the action, and return the
 * response correlated to it. `network` and `request` each open a fresh session,
 * so a request seen by one cannot be looked up by the other; this command keeps
 * the session open from before the action until the body has been read.
 */
export async function capture(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    const timeoutMs = Math.min(Math.max(parseInt(options.timeout ?? '20000', 10) || 20000, 1000), 120000);
    const pattern = new RegExp(options.match);
    const unsubscribe = [];
    try {
        await client.connect(targetTab(options));
        await client.enableNetwork();
        const seen = new Map();
        const finished = new Map();
        let settle;
        const arrived = new Promise((resolve) => { settle = resolve; });
        const now = () => Date.now();
        unsubscribe.push(client.on('Network.requestWillBeSent', (p) => {
            seen.set(p.requestId, {
                requestId: p.requestId, url: p.request?.url, method: p.request?.method,
                frameId: p.frameId, type: p.type, wallTime: p.wallTime, monotonic: p.timestamp,
                postData: p.request?.postData,
            });
        }));
        unsubscribe.push(client.on('Network.responseReceived', (p) => {
            const r = seen.get(p.requestId);
            if (r)
                Object.assign(r, { status: p.response?.status, mimeType: p.response?.mimeType,
                    responseUrl: p.response?.url, frameId: p.frameId ?? r.frameId, responseReceivedAtMs: now() });
        }));
        unsubscribe.push(client.on('Network.loadingFinished', (p) => {
            const r = seen.get(p.requestId);
            if (r && pattern.test(r.url ?? '')) {
                finished.set(p.requestId, { ...r, finishedAt: p.timestamp, encodedDataLength: p.encodedDataLength });
                settle?.();
            }
        }));
        unsubscribe.push(client.on('Network.loadingFailed', (p) => {
            const r = seen.get(p.requestId);
            if (r) {
                r.failed = p.errorText ?? 'failed';
                if (pattern.test(r.url ?? ''))
                    settle?.();
            }
        }));
        const startedAt = now();
        const key = (type, params) => client.send('Input.dispatchKeyEvent', { type, ...params });
        if (options.fill !== undefined && options.text !== undefined) {
            await client.click(options.fill);
            // `commands` makes the browser perform select-all; a bare Ctrl+A key event does not.
            await key('keyDown', { key: 'a', code: 'KeyA', modifiers: 2, commands: ['selectAll'] });
            await key('keyUp', { key: 'a', code: 'KeyA', modifiers: 2 });
            await key('keyDown', { key: 'Delete', code: 'Delete', windowsVirtualKeyCode: 46 });
            await key('keyUp', { key: 'Delete', code: 'Delete', windowsVirtualKeyCode: 46 });
            await client.send('Input.insertText', { text: options.text });
        }
        if (options.script !== undefined) {
            // Page-side action (e.g. click one verified result card). It must report success with `true`.
            const evaluated = await client.send('Runtime.evaluate', { expression: options.script, returnByValue: true });
            if (evaluated.exceptionDetails || evaluated.result?.value !== true) {
                throw new Error('Action script did not return true; no action confirmed');
            }
        }
        if (options.key === 'Enter') {
            await key('keyDown', { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: String.fromCharCode(13) });
            await key('keyUp', { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
        }
        else if (options.key) {
            await client.pressKey(options.key);
        }
        let timerHandle;
        const timer = new Promise((resolve) => { timerHandle = setTimeout(() => resolve('timeout'), timeoutMs); });
        const outcome = await Promise.race([arrived.then(() => 'arrived'), timer]);
        clearTimeout(timerHandle); // a live timer would keep the process up for the full timeout after success
        if (outcome === 'timeout') {
            const shapes = [...new Set([...seen.values()].map((r) => { try {
                    const u = new URL(r.url);
                    return u.host + u.pathname;
                }
                catch {
                    return '?';
                } }))].slice(0, 12);
            throw new Error(`No response matching /${options.match}/ within ${timeoutMs} ms; ${seen.size} requests seen, e.g. ${shapes.join(', ')}`);
        }
        // Last matching response to finish after the action started.
        const chosen = [...finished.values()].pop();
        const body = await client.send('Network.getResponseBody', { requestId: chosen.requestId });
        const text = body.base64Encoded ? Buffer.from(body.body, 'base64').toString('utf8') : body.body;
        const result = {
            profile: options.profile, requestId: chosen.requestId, url: chosen.url, method: chosen.method,
            status: chosen.status, mimeType: chosen.mimeType, frameId: chosen.frameId, type: chosen.type,
            requestWallTime: chosen.wallTime, responseReceivedAtMs: chosen.responseReceivedAtMs,
            actionStartedAtMs: startedAt, capturedAtMs: now(), matchCount: finished.size,
            bodyBytes: Buffer.byteLength(text, 'utf8'),
            bodySha256: createHash('sha256').update(text, 'utf8').digest('hex'),
            body: text,
        };
        const rendered = JSON.stringify(result);
        if (options.out) {
            await fs.writeFile(options.out, rendered, { flag: 'wx' });
            console.log(JSON.stringify({ ...result, body: undefined, out: options.out }));
        }
        else {
            console.log(rendered);
        }
    }
    catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
    }
    finally {
        unsubscribe.forEach((u) => u());
        await client.close();
    }
}
//# sourceMappingURL=capture.js.map