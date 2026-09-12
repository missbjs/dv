import { TabOptions } from '../tab.js';
export interface NavigateOptions extends TabOptions {
    profile: string;
    url: string;
}
export declare function navigate(options: NavigateOptions): Promise<void>;
//# sourceMappingURL=navigate.d.ts.map