export interface EvalOptions {
    profile: string;
    script?: string;
    file?: string;
    json?: boolean;
    yaml?: boolean;
}
export declare function evalCommand(options: EvalOptions): Promise<void>;
//# sourceMappingURL=eval.d.ts.map