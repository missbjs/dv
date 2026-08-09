export interface ConsoleOptions {
    profile: string;
    type?: string;
    filter?: string;
    json?: boolean;
    yaml?: boolean;
    tabId?: string;
}
export declare function consoleCommand(options: ConsoleOptions): Promise<void>;
//# sourceMappingURL=console.d.ts.map