import { TabOptions } from '../tab.js';
export interface RequestOptions extends TabOptions {
    profile: string;
    id: string;
    body?: boolean;
    json?: boolean;
    yaml?: boolean;
}
export declare function request(options: RequestOptions): Promise<void>;
//# sourceMappingURL=request.d.ts.map