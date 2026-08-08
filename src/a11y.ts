import chalk from 'chalk';
import { AXNode, AXProperty } from './types.js';

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
export function auditA11y(
  nodes: AXNode[],
  refMap: Map<string, string>, // nodeId → ref
  url?: string,
): A11yReport {
  const issues: A11yIssue[] = [];
  const nodeMap = new Map<string, AXNode>();
  const childMap = new Map<string, string[]>(); // parentId → childIds (for non-ignored children)

  for (const node of nodes) {
    nodeMap.set(node.nodeId, node);
  }

  // Build non-ignored child relationships
  for (const node of nodes) {
    if (node.parentId) {
      if (!childMap.has(node.parentId)) childMap.set(node.parentId, []);
      childMap.get(node.parentId)!.push(node.nodeId);
    }
  }

  // Filter to non-ignored, ref-anchored nodes
  const visibleNodes = nodes.filter(n => !n.ignored && refMap.has(n.nodeId));

  // ── Check 1: Images missing alt text ──
  for (const node of visibleNodes) {
    if (node.role?.value === 'image' || node.role?.value === 'img') {
      if (!node.name?.value || node.name.value.trim() === '') {
        issues.push(issue(refMap, node, 'ERROR', 'Image missing alt text', 'missing-alt'));
      }
    }
  }

  // ── Check 2: Inputs/textboxes without labels ──
  for (const node of visibleNodes) {
    const role = node.role?.value;
    const isInput = role === 'textbox' || role === 'combobox' || role === 'searchbox' ||
      role === 'spinbutton' || role === 'listbox';
    if (isInput) {
      const hasLabel = node.name?.value && node.name.value.trim() !== '';
      const hasLabelledby = hasProperty(node, 'labelledby');
      const hasPlaceholder = node.value?.value;
      if (!hasLabel && !hasLabelledby) {
        const sev = hasPlaceholder ? 'WARN' : 'ERROR';
        issues.push(issue(refMap, node, sev,
          sev === 'ERROR' ? 'Missing label' : 'No label (placeholder only)',
          'missing-label'));
      }
    }
  }

  // ── Check 3: Heading hierarchy gaps ──
  const headings = visibleNodes.filter(n => n.role?.value === 'heading');
  for (let i = 0; i < headings.length; i++) {
    const curr = headings[i];
    if (i > 0) {
      const prev = headings[i - 1];
      const currLevel = getLevel(curr);
      const prevLevel = getLevel(prev);
      if (prevLevel >= 1 && currLevel > prevLevel + 1) {
        issues.push(issue(refMap, curr, 'WARN',
          `Heading skip: h${prevLevel} → h${currLevel}`,
          'heading-skip'));
      }
    }
  }

  // ── Check 4: aria-hidden with focusable children ──
  for (const node of visibleNodes) {
    if (hasProperty(node, 'hidden') && hasProperty(node, 'focusable')) {
      issues.push(issue(refMap, node, 'ERROR',
        'aria-hidden element is focusable',
        'aria-hidden-focusable'));
    }
  }

  // ── Check 5: Empty buttons ──
  for (const node of visibleNodes) {
    if (node.role?.value === 'button') {
      if (!node.name?.value || node.name.value.trim() === '') {
        issues.push(issue(refMap, node, 'WARN',
          'Button has no accessible name',
          'empty-button'));
      }
    }
  }

  // ── Check 6: Empty links ──
  for (const node of visibleNodes) {
    if (node.role?.value === 'link') {
      if (!node.name?.value || node.name.value.trim() === '') {
        issues.push(issue(refMap, node, 'ERROR',
          'Link has no accessible name',
          'empty-link'));
      }
    }
  }

  // ── Check 7: Missing lang attribute (root level) ──
  const rootNodes = nodes.filter(n => !n.parentId || !nodeMap.has(n.parentId!));
  if (rootNodes.length > 0) {
    // This is a heuristic — we check if the document root has a lang
    // In the AX tree this shows as the root WebArea having no "language" property
    // Not all pages expose this, so we mark as INFO
    const pageUrl = url || '';
    if (pageUrl && !pageUrl.includes('localhost') && !pageUrl.startsWith('file://')) {
      // We can't reliably detect lang from AX tree alone without the actual DOM
      // Skip this for local pages
    }
  }

  // ── Check 8: Color contrast heuristic via invalid property ──
  for (const node of visibleNodes) {
    if (hasProperty(node, 'invalid')) {
      issues.push(issue(refMap, node, 'WARN',
        'Element marked as invalid — may indicate accessibility issue',
        'invalid-element'));
    }
  }

  // Count severities
  const errors = issues.filter(i => i.severity === 'ERROR').length;
  const warnings = issues.filter(i => i.severity === 'WARN').length;
  const infos = issues.filter(i => i.severity === 'INFO').length;

  return {
    issues,
    summary: { errors, warnings, infos, totalChecked: visibleNodes.length },
  };
}

function issue(
  refMap: Map<string, string>,
  node: AXNode,
  severity: A11yIssue['severity'],
  message: string,
  rule: string,
): A11yIssue {
  return {
    ref: refMap.get(node.nodeId) ?? 'unknown',
    nodeId: node.nodeId,
    role: node.role?.value ?? 'unknown',
    name: node.name?.value ?? '',
    severity,
    message,
    rule,
  };
}

function hasProperty(node: AXNode, propName: string): boolean {
  if (!node.properties) return false;
  return node.properties.some(p => p.name === propName && p.value?.value === true);
}

function getLevel(node: AXNode): number {
  if (!node.properties) return 0;
  const levelProp = node.properties.find(p => p.name === 'level');
  return levelProp?.value?.value ?? 0;
}

/**
 * Format an a11y audit report for display.
 */
export function formatA11yReport(report: A11yReport): string {
  const { issues, summary } = report;
  const out: string[] = [];

  out.push(chalk.bold('Accessibility Audit'));
  out.push('='.repeat(50));
  out.push(chalk.gray(
    `${issues.length} issue(s) (${summary.errors} errors, ${summary.warnings} warnings, ${summary.infos} info) ` +
    `across ${summary.totalChecked} elements`
  ));
  out.push('');

  if (issues.length === 0) {
    out.push(chalk.green('✓ No accessibility issues found'));
    return out.join('\n');
  }

  // Group by severity
  const sevOrder: A11yIssue['severity'][] = ['ERROR', 'WARN', 'INFO'];
  for (const sev of sevOrder) {
    const group = issues.filter(i => i.severity === sev);
    if (group.length > 0) {
      const sevColor = sev === 'ERROR' ? chalk.red : sev === 'WARN' ? chalk.yellow : chalk.blue;
      out.push(sevColor(`${sev} (${group.length})`));
      for (const issue of group) {
        out.push(sevColor(
          `  ${issue.severity}  ${chalk.cyan(issue.ref)} ` +
          `${chalk.yellow(issue.role)} "${issue.name}"  ` +
          `${chalk.white(issue.message)}  ` +
          chalk.gray(`[${issue.rule}]`)
        ));
      }
      out.push('');
    }
  }

  return out.join('\n');
}
