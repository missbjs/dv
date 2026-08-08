export interface BatchOptions {
    profile: string;
    /** Array of command+args strings, e.g. ["navigate https://example.com", "snapshot"] */
    commands: string[];
    /** If true, stop on first non-zero exit code */
    bail?: boolean;
    /** Delay between commands in ms */
    delay?: number;
    /** Binary to use (e.g. dv1, dv4) */
    bin?: string;
}
export declare function batch(options: BatchOptions): Promise<void>;
//# sourceMappingURL=batch.d.ts.map