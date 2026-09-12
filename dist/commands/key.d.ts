import { TabOptions } from '../tab.js';
export interface KeyOptions extends TabOptions {
    profile: string;
    key: string;
}
export declare function key(options: KeyOptions): Promise<void>;
//# sourceMappingURL=key.d.ts.map