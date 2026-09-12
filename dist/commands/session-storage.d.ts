import { TabOptions } from '../tab.js';
export interface SessionStorageOptions extends TabOptions {
    profile: string;
    key?: string;
    json?: boolean;
    yaml?: boolean;
}
export declare function sessionStorage(options: SessionStorageOptions): Promise<void>;
//# sourceMappingURL=session-storage.d.ts.map