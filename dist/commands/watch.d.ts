import { TabOptions } from '../tab.js';
export interface WatchOptions extends TabOptions {
    profile: string;
    install?: boolean;
    read?: boolean;
    continuous?: boolean;
}
export declare function watch(options: WatchOptions): Promise<void>;
//# sourceMappingURL=watch.d.ts.map