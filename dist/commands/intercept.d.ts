export interface InterceptOptions {
    profile: string;
    url: string;
    action: 'block' | 'mock';
    response?: string;
}
export declare function intercept(options: InterceptOptions): Promise<void>;
//# sourceMappingURL=intercept.d.ts.map