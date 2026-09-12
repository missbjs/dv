import { TabOptions } from '../tab.js';
export interface FrameOptions extends TabOptions {
    profile: string;
    selector?: string;
    parent?: boolean;
    top?: boolean;
    list?: boolean;
    index?: number;
    json?: boolean;
    yaml?: boolean;
}
export declare function frame(options: FrameOptions): Promise<void>;
//# sourceMappingURL=frame.d.ts.map