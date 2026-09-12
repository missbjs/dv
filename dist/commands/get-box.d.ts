import { TabOptions } from '../tab.js';
export interface GetBoxOptions extends TabOptions {
    profile: string;
    selector: string;
    json?: boolean;
    yaml?: boolean;
}
export declare function getBox(options: GetBoxOptions): Promise<void>;
//# sourceMappingURL=get-box.d.ts.map