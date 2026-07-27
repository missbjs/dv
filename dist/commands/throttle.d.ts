export interface ThrottleOptions {
    profile: string;
    offline?: boolean;
    slow3g?: boolean;
    fast3g?: boolean;
}
export declare function throttle(options: ThrottleOptions): Promise<void>;
//# sourceMappingURL=throttle.d.ts.map