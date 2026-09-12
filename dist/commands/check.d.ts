import { TabOptions } from '../tab.js';
export interface ToggleOptions extends TabOptions {
    profile: string;
    selector: string;
}
export declare function check(options: ToggleOptions): Promise<void>;
export declare function uncheck(options: ToggleOptions): Promise<void>;
//# sourceMappingURL=check.d.ts.map