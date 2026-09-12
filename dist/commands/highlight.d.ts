import { TabOptions } from '../tab.js';
export interface HighlightOptions extends TabOptions {
    profile: string;
    selector?: string;
    hide?: boolean;
}
export declare function highlight(options: HighlightOptions): Promise<void>;
//# sourceMappingURL=highlight.d.ts.map