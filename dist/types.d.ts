export interface Profile {
    port: number;
}
export interface ProfileConfig {
    [key: string]: Profile;
}
export interface CDPTarget {
    description: string;
    devtoolsFrontendUrl: string;
    id: string;
    title: string;
    type: string;
    url: string;
    webSocketDebuggerUrl: string;
}
export interface CDPMessage {
    id?: number;
    method?: string;
    params?: any;
    result?: any;
    error?: any;
}
export interface ConsoleMessage {
    type: string;
    text: string;
    url?: string;
    line?: number;
    column?: number;
}
//# sourceMappingURL=types.d.ts.map