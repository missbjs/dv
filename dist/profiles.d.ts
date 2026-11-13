import { Profile, ProfileConfig } from './types.js';
export declare const PROFILES: ProfileConfig;
export declare function getProfile(name: string): Profile | undefined;
export declare function getProfileByPort(port: number): [string, Profile] | undefined;
export declare function listProfiles(): {
    name: string;
    port: number;
}[];
//# sourceMappingURL=profiles.d.ts.map