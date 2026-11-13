/** Start/reuse the singleton and wait for Network.enable on existing targets. */
export declare function ensureNetworkRecorder(profile: string): Promise<void>;
/** A named historical tab need not still be open. Default selection matches other commands. */
export declare function historyTab(profile: string, tab?: string): Promise<string | undefined>;
/** CLI preAction only: probes/explicit historical reads must never switch capture. */
export declare function prepareTabCommand(name: string, options: {
    profile: string;
    tab?: string;
    tabId?: string;
}): Promise<void>;
export declare function stopNetworkRecorder(profile: string): Promise<void>;
/** Internal same-binary entry point: never launches Chrome or creates profiles. */
export declare function runNetworkRecorder(profile: string): Promise<void>;
//# sourceMappingURL=network-recorder.d.ts.map