import { TabOptions } from '../tab.js';
export interface MonitorOptions extends TabOptions {
    types: string;
    profile: string;
}
export declare function monitor(options: MonitorOptions): Promise<void>;
//# sourceMappingURL=monitor.d.ts.map