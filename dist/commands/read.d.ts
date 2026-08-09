export interface ReadOptions {
    profile: string;
    /** Optional CSS selector (supports >>>) to scope --html / --text output */
    selector?: string;
    /** Optional URL to fetch via HTTP instead of reading from the page */
    url?: string;
    /** If true, output the accessibility snapshot text tree */
    snapshot?: boolean;
    /** If true, output the page's body textContent */
    text?: boolean;
    /** If true, output HTML (whole document, or the element when a selector is given) */
    html?: boolean;
    /** Alias for --html */
    dom?: boolean;
    json?: boolean;
    yaml?: boolean;
}
export declare function read(options: ReadOptions): Promise<void>;
//# sourceMappingURL=read.d.ts.map