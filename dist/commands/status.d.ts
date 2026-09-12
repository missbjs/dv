import { ViewportReport } from '../emulation.js';
export interface StatusOptions {
    profile: string;
    json?: boolean;
    yaml?: boolean;
    viewport?: boolean;
}
export declare function status(options: StatusOptions): Promise<void>;
/**
 * The undo, aimed at the tabs that are actually emulated. A bare `resize 0 0`
 * only reaches the tab every other dv command talks to — the first content tab —
 * so anything else has to be named, or the report would point at a command that
 * cannot fix it.
 */
export declare function clearHints(profile: string, tabs: Array<{
    id: string;
    url: string;
}>, viewports: Array<ViewportReport | null>): string[];
//# sourceMappingURL=status.d.ts.map