import { TabOptions } from '../tab.js';
export interface ScreenshotOptions extends TabOptions {
    profile: string;
    output: string;
    selector?: string;
}
export declare function screenshot(options: ScreenshotOptions): Promise<void>;
//# sourceMappingURL=screenshot.d.ts.map