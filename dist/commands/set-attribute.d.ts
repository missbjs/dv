import { TabOptions } from '../tab.js';
export interface SetAttributeOptions extends TabOptions {
    profile: string;
    selector: string;
    attr: string;
    value: string;
}
export declare function setAttribute(options: SetAttributeOptions): Promise<void>;
//# sourceMappingURL=set-attribute.d.ts.map