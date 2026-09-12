import { TabOptions } from '../tab.js';
export interface LocationOptions extends TabOptions {
    lat: number;
    lng: number;
    accuracy?: number;
    profile: string;
}
export declare function location(options: LocationOptions): Promise<void>;
//# sourceMappingURL=location.d.ts.map