import { TabOptions } from '../tab.js';
export interface GetTextOptions extends TabOptions {
    profile: string;
    selector: string;
    json?: boolean;
    yaml?: boolean;
}
export declare function getText(options: GetTextOptions): Promise<void>;
//# sourceMappingURL=get-text.d.ts.map