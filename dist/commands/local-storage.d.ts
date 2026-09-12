import { TabOptions } from '../tab.js';
export interface LocalStorageOptions extends TabOptions {
    profile: string;
    key?: string;
    json?: boolean;
    yaml?: boolean;
}
export declare function localStorage(options: LocalStorageOptions): Promise<void>;
//# sourceMappingURL=local-storage.d.ts.map