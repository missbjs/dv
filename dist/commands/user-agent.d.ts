import { TabOptions } from '../tab.js';
export interface UserAgentOptions extends TabOptions {
    profile: string;
    ua: string;
}
export declare function userAgent(options: UserAgentOptions): Promise<void>;
//# sourceMappingURL=user-agent.d.ts.map