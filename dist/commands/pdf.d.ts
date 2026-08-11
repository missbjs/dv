export interface PdfOptions {
    profile: string;
    output?: string;
    landscape?: boolean;
    printBackground?: boolean;
    paperWidth?: number;
    paperHeight?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    pageRanges?: string;
    preferCSSPageSize?: boolean;
}
export declare function pdf(options: PdfOptions): Promise<void>;
//# sourceMappingURL=pdf.d.ts.map