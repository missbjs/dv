import { TabOptions } from '../tab.js';
export interface DialogOptions extends TabOptions {
    profile: string;
    accept?: boolean;
    dismiss?: boolean;
    text?: string;
}
export declare function dialog(options: DialogOptions): Promise<void>;
//# sourceMappingURL=dialog.d.ts.map