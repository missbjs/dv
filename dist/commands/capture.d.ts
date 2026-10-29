import { TabOptions } from '../tab.js';
export interface CaptureOptions extends TabOptions {
    profile: string;
    match: string;
    fill?: string;
    text?: string;
    key?: string;
    timeout?: string;
    out?: string;
    json?: boolean;
}
/**
 * One process, one CDP session: arm Network, run the action, and return the
 * response correlated to it. `network` and `request` each open a fresh session,
 * so a request seen by one cannot be looked up by the other; this command keeps
 * the session open from before the action until the body has been read.
 */
export declare function capture(options: CaptureOptions): Promise<void>;
//# sourceMappingURL=capture.d.ts.map