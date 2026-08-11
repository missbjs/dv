export interface QueryAllOptions {
    selector: string;
    text?: boolean;
    html?: boolean;
    attr?: string;
    style?: boolean;
    props?: string;
    json?: boolean;
    yaml?: boolean;
    profile: string;
}
export declare function queryAll(options: QueryAllOptions): Promise<void>;
//# sourceMappingURL=query-all.d.ts.map