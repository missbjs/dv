import { TabOptions } from '../tab.js';
export interface HistoryOptions extends TabOptions {
    profile: string;
    back?: boolean;
    forward?: boolean;
    list?: boolean;
    go?: number;
    json?: boolean;
    yaml?: boolean;
}
export declare function history(options: HistoryOptions): Promise<void>;
//# sourceMappingURL=history.d.ts.map