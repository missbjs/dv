export interface QueryOptions {
    profile: string;
    selector: string;
    text?: boolean;
    html?: boolean;
    attr?: string;
    count?: boolean;
    exists?: boolean;
    computedStyle?: boolean;
    props?: string;
    json?: boolean;
    yaml?: boolean;
}
/** Parse a comma-separated --props list into a clean array of property names. */
export declare function parseProps(props?: string): string[];
export declare function buildExpression(selector: string, options: QueryOptions): string;
export declare function query(options: QueryOptions): Promise<void>;
//# sourceMappingURL=query.d.ts.map