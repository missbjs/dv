import { TabOptions } from '../tab.js';
export interface FillOptions extends TabOptions {
    profile: string;
    selector: string;
    value: string;
}
export declare function fill(options: FillOptions): Promise<void>;
//# sourceMappingURL=fill.d.ts.map