import { spawn } from 'node:child_process';
import axios from 'axios';
import { CDPClient } from './cdp.js';
import { getProfile } from './profiles.js';
import { selfCommand } from './runtime.js';
import { TabNetworkRecorder } from './network-capture.js';
import { NetworkStore } from './network-store.js';
import { createRecorderIPC, recorderCall, recorderDirectory, recorderPort } from './network-service.js';
const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function browserEndpoint(profile) {
    const port = getProfile(profile)?.port;
    if (!port)
        throw new Error('Invalid recorder profile');
    const { data } = await axios.get(`http://127.0.0.1:${port}/json/version`, { timeout: 1500, proxy: false });
    const endpoint = new URL(data.webSocketDebuggerUrl);
    // Only the profile's fixed local Chrome endpoint is allowed, never a remote URL.
    if (endpoint.protocol !== 'ws:' || Number(endpoint.port) !== port || !['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname))
        throw new Error('Invalid Chrome browser endpoint');
    endpoint.hostname = '127.0.0.1';
    return endpoint.toString();
}
/** Start/reuse the singleton and wait for Network.enable on existing targets. */
export async function ensureNetworkRecorder(profile) {
    let browserId;
    try {
        browserId = await browserEndpoint(profile);
    }
    catch {
        throw new Error(`Chrome is not running or ready. Run "${profile} start" first.`);
    }
    try {
        const health = await recorderCall(profile, 'health');
        if (health.browserId === browserId && health.ready)
            return;
        if (health.browserId !== browserId)
            await stopNetworkRecorder(profile);
    }
    catch { }
    const self = selfCommand();
    const child = spawn(self.file, [...self.args, '__network-recorder'], {
        detached: true, stdio: 'ignore', windowsHide: true,
        env: { ...process.env, DV_BIN_NAME: profile },
    });
    let spawnError;
    child.on('error', error => { spawnError = error; });
    child.unref();
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
        if (spawnError)
            throw spawnError;
        try {
            const health = await recorderCall(profile, 'health');
            if (health.browserId === browserId && health.ready)
                return;
        }
        catch { }
        await pause(100);
    }
    throw new Error(`Network recorder did not become ready for ${profile}; its private local port ${recorderPort(profile)} may be occupied. Retry "${profile} start".`);
}
/** A named historical tab need not still be open. Default selection matches other commands. */
export async function historyTab(profile, tab) {
    if (tab)
        return tab;
    const client = new CDPClient(getProfile(profile).port);
    const current = await client.resolveCurrentTab();
    await recorderCall(profile, 'select', { tabId: current.id });
    return current.id;
}
const READ_ONLY_COMMANDS = new Set([
    'snapshot', 'screenshot', 'console', 'monitor', 'query', 'inspect', 'query-all',
    'get-text', 'get-html', 'cookies', 'local-storage', 'session-storage', 'read',
    'wait', 'find', 'diff', 'a11y', 'perf', 'frame', 'watch', 'pdf',
    'is-visible', 'is-enabled', 'is-checked', 'value', 'attr', 'box', 'style',
]);
/** CLI preAction only: probes/explicit historical reads must never switch capture. */
export async function prepareTabCommand(name, options) {
    const explicit = options.tab || options.tabId;
    if (explicit && READ_ONLY_COMMANDS.has(name))
        return;
    await ensureNetworkRecorder(options.profile);
    const tabId = explicit ?? (await new CDPClient(getProfile(options.profile).port).resolveCurrentTab()).id;
    await recorderCall(options.profile, 'select', { tabId });
    // Pin the exact resolved target for this invocation, not for future commands.
    options.tab = tabId;
}
export async function stopNetworkRecorder(profile) {
    try {
        await recorderCall(profile, 'shutdown');
    }
    catch { }
}
/** Internal same-binary entry point: never launches Chrome or creates profiles. */
export async function runNetworkRecorder(profile) {
    const browserId = await browserEndpoint(profile);
    const store = new NetworkStore();
    const capture = new TabNetworkRecorder(getProfile(profile).port, store);
    let ready = false;
    let closing = false;
    let timer;
    let ipc;
    const shutdown = async () => {
        if (closing)
            return;
        closing = true;
        ready = false;
        if (timer)
            clearInterval(timer);
        process.removeListener('SIGTERM', onSignal);
        process.removeListener('SIGINT', onSignal);
        await capture.close();
        await ipc?.close();
        store.clear();
    };
    const onSignal = () => { void shutdown(); };
    try {
        ipc = await createRecorderIPC({ profile, port: recorderPort(profile), directory: recorderDirectory(), browserId, store, ready: () => ready,
            selectedTab: () => capture.connected ? capture.tabId : undefined,
            select: tabId => capture.select(tabId), shutdown: () => { void shutdown(); } });
        process.once('SIGTERM', onSignal);
        process.once('SIGINT', onSignal);
        // No focus polling: a manual tab switch is followed on the next default dv command.
        // An ambiguous/no-page browser can keep an idle recorder until an explicit selection.
        let initialTab;
        try {
            initialTab = (await new CDPClient(getProfile(profile).port).resolveCurrentTab()).id;
        }
        catch (error) {
            console.error(`dv network recorder waiting for tab selection: ${error.message}`);
        }
        // Ambiguous focus permits an idle service; genuine attachment failures do not.
        if (initialTab)
            await capture.select(initialTab);
        if (closing)
            return;
        ready = true;
        // Covers Chrome exit/restart even when a socket close is delayed by the OS.
        let checking = false;
        timer = setInterval(async () => {
            if (checking)
                return;
            checking = true;
            try {
                if (await browserEndpoint(profile) !== browserId)
                    await shutdown();
            }
            catch {
                await shutdown();
            }
            finally {
                checking = false;
            }
        }, 2000);
    }
    catch (e) {
        await shutdown();
        // A concurrent starter won the exclusive IPC bind; the parent waits for it.
        if (e.code !== 'EADDRINUSE')
            throw e;
    }
}
//# sourceMappingURL=network-recorder.js.map