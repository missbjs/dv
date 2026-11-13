import { randomUUID } from 'node:crypto';
import { CDPClient } from './cdp.js';
/** One persistent tab CDPClient. Switching never enables browser-wide auto-attach. */
export class TabNetworkRecorder {
    port;
    store;
    client;
    session;
    serial = Promise.resolve();
    bodyFetches = 0;
    tabId;
    constructor(port, store) {
        this.port = port;
        this.store = store;
    }
    get connected() { return this.client?.isConnected ?? false; }
    select(tabId) {
        const result = this.serial.then(() => this.switchTab(tabId));
        this.serial = result.catch(() => { });
        return result;
    }
    async switchTab(tabId) {
        if (this.tabId === tabId && this.connected)
            return;
        const next = new CDPClient(this.port, { collectEvents: false, timeout: 5000, maxPayload: 8 * 1024 * 1024 });
        // Validate before abandoning the previous tab.
        const targets = await next.getTargets();
        if (!targets.some(t => t.id === tabId && t.type === 'page' && !t.url.startsWith('devtools://')))
            throw new Error(`No tab with ID ${tabId}`);
        const session = randomUUID();
        next.on('disconnected', () => this.store.detach(session));
        for (const method of ['Network.requestWillBeSent', 'Network.responseReceived', 'Network.loadingFinished', 'Network.loadingFailed']) {
            next.on(method, params => {
                const row = this.store.event(session, tabId, method, params);
                if (method !== 'Network.loadingFinished' || !row)
                    return;
                if (this.bodyFetches >= 4 || (row.encodedDataLength ?? 0) > this.store.maxBodySize) {
                    this.store.setBody(row.id);
                    if ((row.encodedDataLength ?? 0) > this.store.maxBodySize)
                        row.bodyState = 'too-large';
                    return;
                }
                this.bodyFetches++;
                next.getResponseBody(params.requestId)
                    .then(body => this.store.setBody(row.id, body), () => this.store.setBody(row.id))
                    .finally(() => this.bodyFetches--);
            });
        }
        try {
            await next.connect(tabId);
            // Keep only one persistent Network-enabled tab connection.
            if (this.session)
                this.store.detach(this.session);
            await this.client?.close();
            this.client = undefined;
            await next.send('Network.enable', { maxTotalBufferSize: 8 * 1024 * 1024, maxResourceBufferSize: this.store.maxBodySize });
            this.client = next;
            this.session = session;
            this.tabId = tabId;
        }
        catch (error) {
            await next.close();
            throw error;
        }
    }
    async close() {
        await this.serial;
        if (this.session)
            this.store.detach(this.session);
        await this.client?.close();
        this.client = undefined;
    }
}
//# sourceMappingURL=network-capture.js.map