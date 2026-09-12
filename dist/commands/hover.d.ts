import { TabOptions } from '../tab.js';
export interface HoverOptions extends TabOptions {
    profile: string;
    selector: string;
}
export declare function hover(options: HoverOptions): Promise<void>;
//# sourceMappingURL=hover.d.ts.map