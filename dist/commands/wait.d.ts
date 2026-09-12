import { TabOptions } from '../tab.js';
export interface WaitOptions extends TabOptions {
    profile: string;
    load?: boolean;
    domcontentloaded?: boolean;
    networkidle?: boolean;
    selector?: string;
    text?: string;
    timeout?: number;
    ms?: number;
}
export declare function wait(options: WaitOptions): Promise<void>;
//# sourceMappingURL=wait.d.ts.map