import WebSocket from 'ws';
import { EventEmitter } from 'node:events';
export interface CDPWireMessage {
    id?: number;
    method?: string;
    params?: any;
    result?: any;
    sessionId?: string;
    error?: {
        message?: string;
    };
}
/** Shared wire protocol for page commands and the persistent browser recorder. */
export declare class CDPTransport extends EventEmitter {
    private options;
    socket: WebSocket | null;
    private nextId;
    private pending;
    constructor(options?: {
        timeout?: number;
        maxPayload?: number;
    });
    open(endpoint: string): Promise<void>;
    send(method: string, params?: any, sessionId?: string): Promise<any>;
    close(): Promise<void>;
}
//# sourceMappingURL=cdp-transport.d.ts.map