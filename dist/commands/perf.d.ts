import { TabOptions } from '../tab.js';
export interface PerfOptions extends TabOptions {
    profile: string;
    json?: boolean;
    yaml?: boolean;
}
export declare function perf(options: PerfOptions): Promise<void>;
//# sourceMappingURL=perf.d.ts.map