import { NetworkStore } from './network-store.js';
export declare function recorderDirectory(): string;
export declare function recorderPort(profile: string): number;
interface IPCOptions {
    profile: string;
    port: number;
    directory: string;
    browserId: string;
    store: NetworkStore;
    ready: () => boolean;
    shutdown: () => void;
    select?: (tabId: string) => Promise<void>;
    selectedTab?: () => string | undefined;
}
/** Exclusive loopback bind is the singleton lock; only its owner publishes credentials. */
export declare function createRecorderIPC(options: IPCOptions): Promise<{
    close: () => Promise<void>;
}>;
/** Narrow authenticated RPC. Never proxy arbitrary CDP or expose file paths to pages. */
export declare function recorderCall(profile: string, action: string, data?: Record<string, unknown>, directory?: string): Promise<any>;
export {};
//# sourceMappingURL=network-service.d.ts.map