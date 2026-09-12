import { TabOptions } from '../tab.js';
export interface TypeOptions extends TabOptions {
    profile: string;
    selector: string;
    text: string;
}
export declare function type(options: TypeOptions): Promise<void>;
//# sourceMappingURL=type.d.ts.map