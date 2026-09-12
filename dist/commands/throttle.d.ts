import { TabOptions } from '../tab.js';
export interface ThrottleOptions extends TabOptions {
    profile: string;
    offline?: boolean;
    slow3g?: boolean;
    fast3g?: boolean;
}
export declare function throttle(options: ThrottleOptions): Promise<void>;
//# sourceMappingURL=throttle.d.ts.map