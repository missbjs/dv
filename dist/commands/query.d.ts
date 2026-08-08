export interface QueryOptions {
    profile: string;
    selector: string;
    text?: boolean;
    html?: boolean;
    attr?: string;
    count?: boolean;
    exists?: boolean;
    json?: boolean;
}
export declare function buildExpression(selector: string, options: QueryOptions): string;
export declare function query(options: QueryOptions): Promise<void>;
//# sourceMappingURL=query.d.ts.map