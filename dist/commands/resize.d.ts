import { TabOptions } from '../tab.js';
export interface ResizeOptions extends TabOptions {
    profile: string;
    width: number;
    height: number;
}
export declare function resize(options: ResizeOptions): Promise<void>;
//# sourceMappingURL=resize.d.ts.map