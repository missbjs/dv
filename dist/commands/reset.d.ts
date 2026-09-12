import { TabOptions } from '../tab.js';
import { OutputOptions } from '../output.js';
export interface ResetOptions extends OutputOptions, TabOptions {
    profile: string;
    viewport?: boolean;
    userAgent?: boolean;
    timezone?: boolean;
    geolocation?: boolean;
    network?: boolean;
    allTabs?: boolean;
}
/**
 * Take emulation overrides back off. With no flags it clears the whole bundle —
 * that is the form to reach for when a session has gone strange. Flags narrow it
 * to specific overrides, `--tab` to one tab and `--all-tabs` to every content tab.
 */
export declare function reset(options: ResetOptions): Promise<void>;
//# sourceMappingURL=reset.d.ts.map