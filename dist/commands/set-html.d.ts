import { TabOptions } from '../tab.js';
export interface SetHtmlOptions extends TabOptions {
    profile: string;
    selector: string;
    value: string;
}
export declare function setHtml(options: SetHtmlOptions): Promise<void>;
//# sourceMappingURL=set-html.d.ts.map