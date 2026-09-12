import { TabOptions } from '../tab.js';
export interface QueryOptions extends TabOptions {
    profile: string;
    selector: string;
    text?: boolean;
    html?: boolean;
    attr?: string;
    count?: boolean;
    exists?: boolean;
    computedStyle?: boolean;
    style?: boolean;
    props?: string;
    json?: boolean;
    yaml?: boolean;
}
export declare function buildExpression(selector: string, options: QueryOptions): string;
export declare function query(options: QueryOptions): Promise<void>;
//# sourceMappingURL=query.d.ts.map