import { TabOptions } from '../tab.js';
export interface UploadOptions extends TabOptions {
    profile: string;
    selector: string;
    files: string[];
}
export declare function upload(options: UploadOptions): Promise<void>;
//# sourceMappingURL=upload.d.ts.map