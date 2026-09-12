import { TabOptions } from '../tab.js';
export interface ClickOptions extends TabOptions {
    profile: string;
    selector: string;
}
export declare function click(options: ClickOptions): Promise<void>;
//# sourceMappingURL=click.d.ts.map