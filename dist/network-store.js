import { randomUUID } from 'node:crypto';
/** Browser-lifetime history. Reads never consume records. No secrets are written to disk. */
export class NetworkStore {
    entries = new Map();
    active = new Map();
    bodyBytes = 0;
    sequence = 0;
    epoch = randomUUID();
    limits;
    constructor(limits = {}) {
        this.limits = { maxEntries: 2000, maxBodyBytes: 32 * 1024 * 1024, maxBodySize: 2 * 1024 * 1024, ...limits };
    }
    get maxBodySize() { return this.limits.maxBodySize; }
    list(tabId) {
        return [...this.entries.values()].filter(r => !tabId || r.tabId === tabId);
    }
    find(id, tabId) {
        const exact = this.entries.get(id);
        if (exact)
            return !tabId || exact.tabId === tabId ? exact : undefined;
        const matches = this.list(tabId).filter(r => r.requestId === id);
        if (matches.length > 1)
            throw new Error('Ambiguous CDP request ID; use the unique id from network output');
        return matches[0];
    }
    clear(tabId) {
        for (const row of this.list(tabId))
            this.remove(row.id);
    }
    bytes(body) { return Buffer.byteLength(body.body, body.base64Encoded ? 'base64' : 'utf8'); }
    dropBody(row, state) {
        if (row.body)
            this.bodyBytes -= this.bytes(row.body);
        delete row.body;
        row.bodyState = state;
    }
    remove(id) {
        const row = this.entries.get(id);
        if (row)
            this.dropBody(row, 'evicted');
        this.entries.delete(id);
        for (const [key, value] of this.active)
            if (value === id)
                this.active.delete(key);
    }
    setBody(id, body) {
        const row = this.entries.get(id);
        if (!row)
            return; // clear/eviction while a CDP body fetch was pending
        this.dropBody(row, 'unavailable');
        if (!body)
            return;
        const size = this.bytes(body);
        if (size > this.limits.maxBodySize || size > this.limits.maxBodyBytes) {
            row.bodyState = 'too-large';
            return;
        }
        for (const old of this.entries.values()) {
            if (this.bodyBytes + size <= this.limits.maxBodyBytes)
                break;
            if (old.body)
                this.dropBody(old, 'evicted');
        }
        row.body = body;
        row.bodyState = 'available';
        this.bodyBytes += size;
    }
    detach(session) {
        for (const [key, id] of this.active) {
            if (key.startsWith(session + '\0')) {
                const row = this.entries.get(id);
                if (row?.state === 'pending') {
                    row.state = 'detached';
                    row.bodyState = 'unavailable';
                }
                this.active.delete(key);
            }
        }
    }
    event(session, tabId, method, p, targetId = tabId) {
        const key = session + '\0' + p.requestId;
        let row = this.entries.get(this.active.get(key) ?? '');
        if (method === 'Network.requestWillBeSent') {
            if (p.redirectResponse && row) {
                this.response(row, p.redirectResponse);
                row.state = 'redirected';
                row.endTimestamp = p.timestamp;
                row.bodyState = 'unavailable';
            }
            // Bound untrusted page-controlled strings/headers as well as record count.
            const trim = (value, max = 65536) => typeof value === 'string' ? value.slice(0, max) : undefined;
            const headers = this.headers(p.request?.headers);
            row = {
                id: `${this.epoch}:${++this.sequence}`, requestId: p.requestId, tabId, targetId,
                loaderId: p.loaderId, frameId: p.frameId,
                url: trim(p.request?.url) ?? '', method: trim(p.request?.method, 128) ?? '', type: p.type ?? 'Other',
                timestamp: p.timestamp, wallTime: p.wallTime ?? Date.now() / 1000,
                requestHeaders: headers, postData: trim(p.request?.postData), state: 'pending', bodyState: 'pending',
            };
            this.entries.set(row.id, row);
            this.active.set(key, row.id);
            while (this.entries.size > this.limits.maxEntries)
                this.remove(this.entries.keys().next().value);
            return row;
        }
        if (!row)
            return;
        if (method === 'Network.responseReceived')
            this.response(row, p.response);
        if (method === 'Network.loadingFinished' || method === 'Network.loadingFailed') {
            row.endTimestamp = p.timestamp;
            row.encodedDataLength = p.encodedDataLength;
            row.state = method === 'Network.loadingFailed' ? 'failed' : 'finished';
            if (row.state === 'failed') {
                row.errorText = String(p.errorText ?? 'Request failed').slice(0, 4096);
                row.bodyState = 'unavailable';
            }
            this.active.delete(key);
        }
        return row;
    }
    headers(input) {
        const result = {};
        let remaining = 65536;
        for (const [key, value] of Object.entries(input ?? {})) {
            if (remaining <= 0)
                break;
            const k = key.slice(0, 1024), v = String(value).slice(0, Math.min(8192, remaining));
            Object.defineProperty(result, k, { value: v, enumerable: true, configurable: true });
            remaining -= Buffer.byteLength(k + v);
        }
        return result;
    }
    response(row, response) {
        row.status = response.status;
        row.statusText = String(response.statusText ?? '').slice(0, 1024);
        row.responseHeaders = this.headers(response.headers);
        row.mimeType = response.mimeType;
        row.protocol = response.protocol;
        row.timing = response.timing;
    }
}
//# sourceMappingURL=network-store.js.map