import { AXNode } from './types.js';
/**
 * Accessibility audit issue.
 */
export interface A11yIssue {
    ref: string;
    nodeId: string;
    role: string;
    name: string;
    severity: 'ERROR' | 'WARN' | 'INFO';
    message: string;
    rule: string;
}
/**
 * A11y audit report.
 */
export interface A11yReport {
    issues: A11yIssue[];
    summary: {
        errors: number;
        warnings: number;
        infos: number;
        totalChecked: number;
    };
}
/**
 * Run accessibility audit checks on the given AX nodes and resolved refs.
 *
 * Pure function: does not require CDP connection. The caller provides
 * the node-to-ref mapping.
 */
export declare function auditA11y(nodes: AXNode[], refMap: Map<string, string>, // nodeId → ref
url?: string): A11yReport;
/**
 * Format an a11y audit report for display.
 */
export declare function formatA11yReport(report: A11yReport): string;
//# sourceMappingURL=a11y.d.ts.map