export interface ClipboardOptions {
    profile: string;
    /** clipboard action: read, write, copy, paste */
    action: 'read' | 'write' | 'copy' | 'paste';
    /** Text to write (required for write action) */
    text?: string;
    json?: boolean;
    yaml?: boolean;
}
export declare function clipboard(options: ClipboardOptions): Promise<void>;
//# sourceMappingURL=clipboard.d.ts.map