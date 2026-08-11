export interface IsStateOptions {
    profile: string;
    selector: string;
    json?: boolean;
    yaml?: boolean;
}
export declare function isVisible(options: IsStateOptions): Promise<void>;
export declare function isEnabled(options: IsStateOptions): Promise<void>;
export declare function isChecked(options: IsStateOptions): Promise<void>;
//# sourceMappingURL=is-state.d.ts.map