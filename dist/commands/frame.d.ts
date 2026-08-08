export interface FrameOptions {
    profile: string;
    selector?: string;
    parent?: boolean;
    top?: boolean;
    list?: boolean;
    index?: number;
}
export declare function frame(options: FrameOptions): Promise<void>;
//# sourceMappingURL=frame.d.ts.map