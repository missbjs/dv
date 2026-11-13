import WebSocket from 'ws';
import { EventEmitter } from 'node:events';

export interface CDPWireMessage {
  id?: number; method?: string; params?: any; result?: any;
  sessionId?: string; error?: { message?: string };
}

/** Shared wire protocol for page commands and the persistent browser recorder. */
export class CDPTransport extends EventEmitter {
  socket: WebSocket | null = null;
  private nextId = 0;
  private pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void; timer: NodeJS.Timeout }>();
  constructor(private options: { timeout?: number; maxPayload?: number } = {}) { super(); }
  async open(endpoint: string): Promise<void> {
    if (this.socket) throw new Error('Already connected');
    const ws = this.socket = new WebSocket(endpoint, { handshakeTimeout: 5000, maxPayload: this.options.maxPayload ?? 100 * 1024 * 1024 });
    const rejectPending = (error: Error) => {
      for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(error); }
      this.pending.clear();
    };
    ws.on('message', raw => {
      let message: CDPWireMessage;
      try { message = JSON.parse(String(raw)); } catch { return; }
      if (message.id !== undefined) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        clearTimeout(pending.timer); this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message ?? JSON.stringify(message.error)));
        else pending.resolve(message.result);
      } else if (message.method) this.emit('event', message);
    });
    ws.on('error', error => rejectPending(new Error(`WebSocket error: ${error.message}`)));
    ws.on('close', () => { this.socket = null; rejectPending(new Error('CDP connection closed')); this.emit('close'); });
    await new Promise<void>((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  }
  send(method: string, params?: any, sessionId?: string): Promise<any> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return Promise.reject(new Error('Not connected. Call connect() first.'));
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Timeout waiting for CDP response: ${method}`)); }, this.options.timeout ?? 30000);
      this.pending.set(id, { resolve, reject, timer });
      const failed = (error?: Error | null) => {
        if (error && this.pending.delete(id)) { clearTimeout(timer); reject(new Error(`WebSocket send failed: ${error.message}`)); }
      };
      try { this.socket!.send(JSON.stringify({ id, method, params, sessionId }), failed); }
      catch (error) { failed(error as Error); }
    });
  }
  async close(): Promise<void> {
    const ws = this.socket;
    if (!ws || ws.readyState === WebSocket.CLOSED) return;
    await new Promise<void>(resolve => {
      const timer = setTimeout(() => ws.terminate(), 500);
      ws.once('close', () => { clearTimeout(timer); resolve(); });
      if (ws.readyState === WebSocket.CONNECTING) ws.terminate();
      else ws.close();
    });
  }
}
