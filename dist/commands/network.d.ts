import { TabOptions } from '../tab.js';
export interface NetworkOptions extends TabOptions {
    filter?: string;
    clear?: boolean;
    json?: boolean;
    yaml?: boolean;
    profile: string;
}
export declare function network(options: NetworkOptions): Promise<void>;
//# sourceMappingURL=network.d.ts.map