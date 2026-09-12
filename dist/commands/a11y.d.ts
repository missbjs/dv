import { TabOptions } from '../tab.js';
export interface A11yOptions extends TabOptions {
    profile: string;
    /** Output as JSON */
    json?: boolean;
    yaml?: boolean;
}
export declare function a11y(options: A11yOptions): Promise<void>;
//# sourceMappingURL=a11y.d.ts.map