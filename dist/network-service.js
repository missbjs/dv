import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { profileRoot } from './runtime.js';
import { getProfile } from './profiles.js';
const PROTOCOL = 1;
export function recorderDirectory() { return path.join(path.dirname(profileRoot()), 'network-runtime'); }
function descriptorPath(profile, directory) {
    if (!getProfile(profile))
        throw new Error('Invalid recorder profile');
    return path.join(directory, profile + '.json');
}
export function recorderPort(profile) {
    const config = getProfile(profile);
    if (!config)
        throw new Error('Invalid recorder profile');
    return config.port + 10000;
}
/** Exclusive loopback bind is the singleton lock; only its owner publishes credentials. */
export async function createRecorderIPC(options) {
    const file = descriptorPath(options.profile, options.directory);
    const token = randomBytes(32).toString('hex');
    const server = http.createServer((req, res) => {
        const auth = Buffer.from(req.headers.authorization ?? '');
        const expected = Buffer.from('Bearer ' + token);
        const reply = (status, value) => {
            res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Connection': 'close' });
            res.end(JSON.stringify(value));
        };
        if (req.method !== 'POST' || req.url !== '/' || req.headers.origin || auth.length !== expected.length || !timingSafeEqual(auth, expected)) {
            reply(403, { error: 'Forbidden' });
            req.resume();
            return;
        }
        let text = '';
        req.on('data', chunk => { text += chunk; if (text.length > 4096)
            req.destroy(); });
        req.on('error', () => { });
        req.on('end', async () => {
            try {
                const { action, tabId, id, body } = JSON.parse(text);
                if (tabId !== undefined && (typeof tabId !== 'string' || tabId.length > 256))
                    throw new Error('Invalid tab ID');
                if (action === 'health') {
                    const tabId = options.selectedTab?.();
                    reply(200, { protocol: PROTOCOL, profile: options.profile, browserId: options.browserId, ready: options.ready(), attached: !!tabId, tabId });
                    return;
                }
                if (action === 'shutdown') {
                    reply(200, { stopped: true });
                    setImmediate(options.shutdown);
                    return;
                }
                if (!options.ready()) {
                    reply(503, { error: 'Network recorder is still attaching' });
                    return;
                }
                if (action === 'select') {
                    if (!tabId || !options.select)
                        throw new Error('A live tab ID is required for selection');
                    await options.select(tabId);
                    reply(200, { tabId });
                }
                else if (action === 'export') {
                    reply(200, { entries: options.store.list(tabId) });
                }
                else if (action === 'list') {
                    reply(200, { entries: options.store.list(tabId).map(({ body: _body, ...entry }) => entry) });
                }
                else if (action === 'get') {
                    if (typeof id !== 'string' || id.length > 256)
                        throw new Error('Invalid request ID');
                    const row = options.store.find(id, tabId);
                    if (!row) {
                        reply(404, { error: `Request not found: ${id}` });
                        return;
                    }
                    const { body: saved, ...entry } = row;
                    reply(200, body ? { ...entry, body: saved } : entry);
                }
                else if (action === 'clear') {
                    options.store.clear(tabId);
                    reply(200, { cleared: true });
                }
                else
                    reply(400, { error: 'Unknown recorder action' });
            }
            catch (e) {
                reply(400, { error: e.message });
            }
        });
    });
    server.requestTimeout = 5000;
    server.headersTimeout = 5000;
    server.maxConnections = 16;
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(options.port, '127.0.0.1', () => { server.removeListener('error', reject); resolve(); });
    });
    server.on('error', () => { });
    const descriptor = { protocol: PROTOCOL, profile: options.profile, port: server.address().port, token, pid: process.pid, browserId: options.browserId };
    const temporary = file + '.' + token + '.tmp';
    try {
        await fs.mkdir(options.directory, { recursive: true, mode: 0o700 });
        await fs.writeFile(temporary, JSON.stringify(descriptor), { mode: 0o600, flag: 'wx' });
        await fs.rename(temporary, file);
    }
    catch (e) {
        server.close();
        await fs.rm(temporary, { force: true });
        throw e;
    }
    let closed = false;
    return { close: async () => {
            if (closed)
                return;
            closed = true;
            server.closeAllConnections();
            await new Promise(resolve => server.close(() => resolve()));
            try {
                const current = JSON.parse(await fs.readFile(file, 'utf8'));
                if (current.token === token)
                    await fs.rm(file, { force: true });
            }
            catch { }
        } };
}
/** Narrow authenticated RPC. Never proxy arbitrary CDP or expose file paths to pages. */
export async function recorderCall(profile, action, data = {}, directory = recorderDirectory()) {
    const descriptor = JSON.parse(await fs.readFile(descriptorPath(profile, directory), 'utf8'));
    if (descriptor.protocol !== PROTOCOL || descriptor.profile !== profile || !Number.isInteger(descriptor.port) || descriptor.port < 1 || descriptor.port > 65535 || !/^[a-f0-9]{64}$/.test(descriptor.token))
        throw new Error('Invalid network recorder descriptor');
    return new Promise((resolve, reject) => {
        const req = http.request({ host: '127.0.0.1', port: descriptor.port, path: '/', method: 'POST',
            headers: { Authorization: 'Bearer ' + descriptor.token, 'Content-Type': 'application/json' }, timeout: 10000 }, res => {
            let text = '';
            res.on('data', chunk => { text += chunk; if (text.length > 256 * 1024 * 1024)
                res.destroy(new Error('Recorder reply too large')); });
            res.on('error', reject);
            res.on('end', () => {
                try {
                    const value = JSON.parse(text);
                    res.statusCode === 200 ? resolve(value) : reject(new Error(value.error ?? 'Network recorder error'));
                }
                catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => req.destroy(new Error('Network recorder request timed out')));
        req.end(JSON.stringify({ ...data, action }));
    });
}
//# sourceMappingURL=network-service.js.map