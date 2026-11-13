import WebSocket from 'ws';
import { EventEmitter } from 'node:events';
/** Shared wire protocol for page commands and the persistent browser recorder. */
export class CDPTransport extends EventEmitter {
    options;
    socket = null;
    nextId = 0;
    pending = new Map();
    constructor(options = {}) {
        super();
        this.options = options;
    }
    async open(endpoint) {
        if (this.socket)
            throw new Error('Already connected');
        const ws = this.socket = new WebSocket(endpoint, { handshakeTimeout: 5000, maxPayload: this.options.maxPayload ?? 100 * 1024 * 1024 });
        const rejectPending = (error) => {
            for (const pending of this.pending.values()) {
                clearTimeout(pending.timer);
                pending.reject(error);
            }
            this.pending.clear();
        };
        ws.on('message', raw => {
            let message;
            try {
                message = JSON.parse(String(raw));
            }
            catch {
                return;
            }
            if (message.id !== undefined) {
                const pending = this.pending.get(message.id);
                if (!pending)
                    return;
                clearTimeout(pending.timer);
                this.pending.delete(message.id);
                if (message.error)
                    pending.reject(new Error(message.error.message ?? JSON.stringify(message.error)));
                else
                    pending.resolve(message.result);
            }
            else if (message.method)
                this.emit('event', message);
        });
        ws.on('error', error => rejectPending(new Error(`WebSocket error: ${error.message}`)));
        ws.on('close', () => { this.socket = null; rejectPending(new Error('CDP connection closed')); this.emit('close'); });
        await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
    }
    send(method, params, sessionId) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN)
            return Promise.reject(new Error('Not connected. Call connect() first.'));
        const id = ++this.nextId;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Timeout waiting for CDP response: ${method}`)); }, this.options.timeout ?? 30000);
            this.pending.set(id, { resolve, reject, timer });
            const failed = (error) => {
                if (error && this.pending.delete(id)) {
                    clearTimeout(timer);
                    reject(new Error(`WebSocket send failed: ${error.message}`));
                }
            };
            try {
                this.socket.send(JSON.stringify({ id, method, params, sessionId }), failed);
            }
            catch (error) {
                failed(error);
            }
        });
    }
    async close() {
        const ws = this.socket;
        if (!ws || ws.readyState === WebSocket.CLOSED)
            return;
        await new Promise(resolve => {
            const timer = setTimeout(() => ws.terminate(), 500);
            ws.once('close', () => { clearTimeout(timer); resolve(); });
            if (ws.readyState === WebSocket.CONNECTING)
                ws.terminate();
            else
                ws.close();
        });
    }
}
//# sourceMappingURL=cdp-transport.js.map