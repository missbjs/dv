import { TabOptions } from '../tab.js';
export interface SnapshotOptions extends TabOptions {
    profile: string;
    json?: boolean;
    yaml?: boolean;
}
export declare function snapshot(options: SnapshotOptions): Promise<void>;
//# sourceMappingURL=snapshot.d.ts.map