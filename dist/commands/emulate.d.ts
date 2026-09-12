import { TabOptions } from '../tab.js';
export interface EmulateOptions extends TabOptions {
    profile: string;
    device: string;
    /** Load this URL inside the same CDP session, so the site sees the device user agent. */
    navigate?: string;
    /** Reload the current page inside the same CDP session, for the same reason. */
    reload?: boolean;
}
export declare function emulate(options: EmulateOptions): Promise<void>;
//# sourceMappingURL=emulate.d.ts.map