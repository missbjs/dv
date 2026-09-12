import { TabOptions } from '../tab.js';
export interface DragOptions extends TabOptions {
    profile: string;
    source: string;
    target: string;
}
export declare function drag(options: DragOptions): Promise<void>;
//# sourceMappingURL=drag.d.ts.map