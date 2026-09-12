import { TabOptions } from '../tab.js';
export interface GetAttrOptions extends TabOptions {
    profile: string;
    selector: string;
    attr: string;
    json?: boolean;
    yaml?: boolean;
}
export declare function getAttr(options: GetAttrOptions): Promise<void>;
//# sourceMappingURL=get-attr.d.ts.map