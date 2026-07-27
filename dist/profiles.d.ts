import { ProfileConfig } from './types.js';
export declare const PROFILES: ProfileConfig;
export declare function getProfile(name: string): import("./types.js").Profile;
export declare function getProfileByPort(port: number): [string, import("./types.js").Profile] | undefined;
export declare function listProfiles(): {
    name: string;
    port: number;
}[];
//# sourceMappingURL=profiles.d.ts.map