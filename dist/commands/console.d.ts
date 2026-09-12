import { TabOptions } from '../tab.js';
export interface ConsoleOptions extends TabOptions {
    profile: string;
    type?: string;
    filter?: string;
    json?: boolean;
    yaml?: boolean;
}
export declare function consoleCommand(options: ConsoleOptions): Promise<void>;
//# sourceMappingURL=console.d.ts.map