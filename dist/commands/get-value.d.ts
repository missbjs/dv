import { TabOptions } from '../tab.js';
export interface GetValueOptions extends TabOptions {
    profile: string;
    selector: string;
    json?: boolean;
    yaml?: boolean;
}
export declare function getValue(options: GetValueOptions): Promise<void>;
//# sourceMappingURL=get-value.d.ts.map