export interface DiffOptions {
    profile: string;
    /** Compare snapshots (snapshot1.json snapshot2.json) */
    files?: [string, string];
    /** Compare current tab with a saved snapshot file */
    compare?: string;
    /** If set, take a screenshot instead of a snapshot */
    screenshot?: boolean;
    /** Output file for the diff analysis */
    output?: string;
    json?: boolean;
    yaml?: boolean;
}
export declare function diff(options: DiffOptions): Promise<void>;
//# sourceMappingURL=diff.d.ts.map