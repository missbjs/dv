import { TabOptions } from '../tab.js';
export interface FocusOptions extends TabOptions {
    profile: string;
    selector: string;
}
export declare function focus(options: FocusOptions): Promise<void>;
//# sourceMappingURL=focus.d.ts.map