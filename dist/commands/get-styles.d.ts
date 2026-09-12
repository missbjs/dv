import { TabOptions } from '../tab.js';
export interface GetStylesOptions extends TabOptions {
    profile: string;
    selector: string;
    props?: string;
    json?: boolean;
    yaml?: boolean;
}
export declare function getStyles(options: GetStylesOptions): Promise<void>;
//# sourceMappingURL=get-styles.d.ts.map