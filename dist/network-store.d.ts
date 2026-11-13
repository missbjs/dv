export interface ResponseBody {
    body: string;
    base64Encoded: boolean;
}
export interface NetworkEntry {
    id: string;
    requestId: string;
    tabId: string;
    targetId: string;
    loaderId?: string;
    frameId?: string;
    url: string;
    method: string;
    type: string;
    timestamp: number;
    wallTime: number;
    endTimestamp?: number;
    requestHeaders: Record<string, string>;
    postData?: string;
    status?: number;
    statusText?: string;
    responseHeaders?: Record<string, string>;
    mimeType?: string;
    protocol?: string;
    timing?: any;
    encodedDataLength?: number;
    state: 'pending' | 'finished' | 'failed' | 'redirected' | 'detached';
    errorText?: string;
    bodyState: 'pending' | 'available' | 'unavailable' | 'too-large' | 'evicted';
    body?: ResponseBody;
}
/** Browser-lifetime history. Reads never consume records. No secrets are written to disk. */
export declare class NetworkStore {
    private entries;
    private active;
    private bodyBytes;
    private sequence;
    private epoch;
    private limits;
    constructor(limits?: Partial<NetworkStore['limits']>);
    get maxBodySize(): number;
    list(tabId?: string): NetworkEntry[];
    find(id: string, tabId?: string): NetworkEntry | undefined;
    clear(tabId?: string): void;
    private bytes;
    private dropBody;
    private remove;
    setBody(id: string, body?: ResponseBody): void;
    detach(session: string): void;
    event(session: string, tabId: string, method: string, p: any, targetId?: string): NetworkEntry | undefined;
    private headers;
    private response;
}
//# sourceMappingURL=network-store.d.ts.map