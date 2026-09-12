import { TabOptions } from '../tab.js';
export interface InspectOptions extends TabOptions {
    profile: string;
    selector: string;
    json?: boolean;
    yaml?: boolean;
}
export declare function inspect(options: InspectOptions): Promise<void>;
//# sourceMappingURL=inspect.d.ts.map