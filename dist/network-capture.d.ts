import { NetworkStore } from './network-store.js';
/** One persistent tab CDPClient. Switching never enables browser-wide auto-attach. */
export declare class TabNetworkRecorder {
    private port;
    readonly store: NetworkStore;
    private client?;
    private session?;
    private serial;
    private bodyFetches;
    tabId?: string;
    constructor(port: number, store: NetworkStore);
    get connected(): boolean;
    select(tabId: string): Promise<void>;
    private switchTab;
    close(): Promise<void>;
}
//# sourceMappingURL=network-capture.d.ts.map