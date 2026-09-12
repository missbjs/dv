import { TabOptions } from '../tab.js';
export interface ScrollOptions extends TabOptions {
    profile: string;
    selector?: string;
    deltaX?: number;
    deltaY?: number;
}
export declare function scroll(options: ScrollOptions): Promise<void>;
//# sourceMappingURL=scroll.d.ts.map