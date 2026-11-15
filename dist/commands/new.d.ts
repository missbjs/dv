export interface NewOptions {
    profile: string;
    url: string;
    /** Open the tab in its own OS window (CDP Target.createTarget newWindow). */
    window?: boolean;
    json?: boolean;
    yaml?: boolean;
}
export declare function newPage(options: NewOptions): Promise<void>;
//# sourceMappingURL=new.d.ts.map