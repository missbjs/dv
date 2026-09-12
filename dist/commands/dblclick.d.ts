import { TabOptions } from '../tab.js';
export interface DblClickOptions extends TabOptions {
    profile: string;
    selector: string;
}
export declare function dblclick(options: DblClickOptions): Promise<void>;
//# sourceMappingURL=dblclick.d.ts.map