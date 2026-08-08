export interface ReadOptions {
    profile: string;
    /** Optional URL to fetch via HTTP instead of reading from the page */
    url?: string;
    /** If true, output the accessibility snapshot text tree */
    snapshot?: boolean;
    /** If true, output the page's body textContent */
    text?: boolean;
}
export declare function read(options: ReadOptions): Promise<void>;
//# sourceMappingURL=read.d.ts.map