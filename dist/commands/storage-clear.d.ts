import { TabOptions } from '../tab.js';
export interface StorageClearOptions extends TabOptions {
    profile: string;
    type: 'local' | 'session' | 'all';
}
export declare function storageClear(options: StorageClearOptions): Promise<void>;
//# sourceMappingURL=storage-clear.d.ts.map