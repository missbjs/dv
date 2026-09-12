import { TabOptions } from '../tab.js';
export interface SetTextOptions extends TabOptions {
    profile: string;
    selector: string;
    value: string;
}
export declare function setText(options: SetTextOptions): Promise<void>;
//# sourceMappingURL=set-text.d.ts.map