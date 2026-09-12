import { TabOptions } from '../tab.js';
export interface EvalOptions extends TabOptions {
    profile: string;
    script?: string;
    file?: string;
    json?: boolean;
    yaml?: boolean;
}
export declare function evalCommand(options: EvalOptions): Promise<void>;
//# sourceMappingURL=eval.d.ts.map