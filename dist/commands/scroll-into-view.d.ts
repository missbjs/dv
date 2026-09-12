import { TabOptions } from '../tab.js';
export interface ScrollIntoViewOptions extends TabOptions {
    profile: string;
    selector: string;
}
export declare function scrollIntoView(options: ScrollIntoViewOptions): Promise<void>;
//# sourceMappingURL=scroll-into-view.d.ts.map