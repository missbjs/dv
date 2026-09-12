import { TabOptions } from '../tab.js';
export interface GetHtmlOptions extends TabOptions {
    selector: string;
    profile: string;
    json?: boolean;
    yaml?: boolean;
}
export declare function getHtml(options: GetHtmlOptions): Promise<void>;
//# sourceMappingURL=get-html.d.ts.map