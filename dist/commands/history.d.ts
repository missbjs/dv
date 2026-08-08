export interface HistoryOptions {
    profile: string;
    back?: boolean;
    forward?: boolean;
    list?: boolean;
    go?: number;
}
export declare function history(options: HistoryOptions): Promise<void>;
//# sourceMappingURL=history.d.ts.map