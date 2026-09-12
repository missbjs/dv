import { TabOptions } from '../tab.js';
export interface TimezoneOptions extends TabOptions {
    profile: string;
    tz: string;
}
export declare function timezone(options: TimezoneOptions): Promise<void>;
//# sourceMappingURL=timezone.d.ts.map