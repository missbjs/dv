import { TabOptions } from '../tab.js';
export interface CookiesOptions extends TabOptions {
    profile: string;
    domain?: string;
    json?: boolean;
    yaml?: boolean;
}
export declare function cookies(options: CookiesOptions): Promise<void>;
//# sourceMappingURL=cookies.d.ts.map