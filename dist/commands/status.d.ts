import { ViewportReport } from '../emulation.js';
export interface StatusOptions {
    profile: string;
    json?: boolean;
    yaml?: boolean;
    viewport?: boolean;
}
export declare function status(options: StatusOptions): Promise<void>;
/** Name affected tabs explicitly: target-list order does not identify live focus. */
export declare function clearHints(profile: string, tabs: Array<{
    id: string;
    url: string;
}>, viewports: Array<ViewportReport | null>): string[];
//# sourceMappingURL=status.d.ts.map