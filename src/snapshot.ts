import { CDPClient } from './cdp.js';
import { AXNode, AXProperty, RefEntry, SnapshotLine, SnapshotResult } from './types.js';
import chalk from 'chalk';

/** Check if a target string is a dv ref (e.g. "@e1", "@e1-2-3") */
export function isRef(target: string): boolean {
  return /^@e[\d]+(?:-[\d]+)*$/.test(target);
}

/** Parse a ref string into its path segments: "@e1-2-3" → [1, 2, 3] */
export function parseRef(ref: string): number[] {
  const cleaned = ref.replace(/^@e/, '');
  if (!cleaned) return [];
  return cleaned.split('-').map(Number);
}

/** Compare two refs for snapshot diff sorting */
export function compareRefs(a: string, b: string): number {
  const pa = parseRef(a);
  const pb = parseRef(b);
  const len = Math.min(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return pa.length - pb.length;
}

/**
 * Extract property flags for display in snapshot output.
 * Returns an array of human-readable flags like "focusable", "focused", "disabled".
 */
export function extractFlags(node: AXNode): string[] {
  const flags: string[] = [];
  if (!node.properties) return flags;

  for (const prop of node.properties) {
    const v = prop.value;
    switch (prop.name) {
      case 'focusable':
        if (v.value === true) flags.push('focusable');
        break;
      case 'focused':
        if (v.value === true) flags.push('focused');
        break;
      case 'disabled':
        if (v.value === true) flags.push('disabled');
        break;
      case 'editable':
        if (v.value === true) flags.push('editable');
        break;
      case 'checked':
        if (v.value !== undefined && v.value !== false) flags.push(`checked=${v.value}`);
        break;
      case 'expanded':
        if (v.value !== undefined) flags.push(v.value ? 'expanded' : 'collapsed');
        break;
      case 'selected':
        if (v.value === true) flags.push('selected');
        break;
      case 'required':
        if (v.value === true) flags.push('required');
        break;
      case 'invalid':
        if (v.value === true) flags.push('invalid');
        break;
      case 'readonly':
        if (v.value === true) flags.push('readonly');
        break;
      case 'hidden':
        if (v.value === true) flags.push('hidden');
        break;
      case 'modal':
        if (v.value === true) flags.push('modal');
        break;
      case 'multiline':
        if (v.value === true) flags.push('multiline');
        break;
      case 'level':
        if (v.value !== undefined) flags.push(`level=${v.value}`);
        break;
      case 'hasPopup':
        if (v.value !== undefined && v.value !== false) flags.push(`hasPopup=${v.value}`);
        break;
      case 'pressed':
        if (v.value !== undefined && v.value !== false) flags.push(`pressed=${v.value}`);
        break;
      case 'orientation':
        if (v.value === 'vertical' || v.value === 'horizontal') flags.push(v.value);
        break;
    }
  }

  return flags;
}

/**
 * Build snapshot lines from an AX tree, using existing data-dv-ref anchors.
 *
 * This is a pure function: it takes the AX nodes and a map of
 * backendDOMNodeId → existing ref (read from DOM). It produces SnapshotResult.
 *
 * The caller is responsible for reading + writing data-dv-ref via CDPClient.
 *
 * Algorithm:
 * 1. Build a lookup map: nodeId → AXNode
 * 2. Find root nodes (no parent or parent is ignored/generic root)
 * 3. DFS traverse: skip ignored nodes, assign refs:
 *    - If backendDOMNodeId in existingRefs → use that ref
 *    - Otherwise → generate new ref from parent's next index
 */
export function buildSnapshotLines(
  nodes: AXNode[],
  existingRefs: Map<number, string>,
): SnapshotResult {
  const nodeMap = new Map<string, AXNode>();
  const rootNodes: AXNode[] = [];
  const usedNewRefs: Map<number, string> = new Map(); // backendDOMNodeId → newly assigned ref

  for (const node of nodes) {
    nodeMap.set(node.nodeId, node);
  }

  // Find root nodes: those with no parentId or whose parent is not in the tree
  // Also treat the generic ignored root as transparent
  for (const node of nodes) {
    if (!node.parentId) {
      rootNodes.push(node);
    } else {
      const parent = nodeMap.get(node.parentId);
      if (!parent) {
        rootNodes.push(node);
      }
    }
  }

  // If there's a single root that is ignored (the generic "RootWebArea" wrapper),
  // traverse its children instead — but still include it for depth computation
  const effectiveRoots: AXNode[] = [];
  for (const root of rootNodes) {
    if (root.ignored && root.childIds && root.childIds.length > 0) {
      for (const childId of root.childIds) {
        const child = nodeMap.get(childId);
        if (child) effectiveRoots.push(child);
      }
    } else if (!root.ignored) {
      effectiveRoots.push(root);
    }
  }

  const lines: SnapshotLine[] = [];
  const refs = new Map<string, RefEntry>();
  const backendNodeMap = new Map<number, string>(); // backendDOMNodeId → ref

  // Track the next sibling index for each parent ref
  const siblingCounters = new Map<string, number>();

  function getNextRef(parentRef: string | null): string {
    const key = parentRef ?? '__root__';
    const next = (siblingCounters.get(key) ?? 0) + 1;
    siblingCounters.set(key, next);
    if (parentRef) {
      return `${parentRef}-${next}`;
    }
    return `@e${next}`;
  }

  function dfs(node: AXNode, parentRef: string | null, depth: number) {
    // Skip ignored nodes and leaf text nodes; traverse their children at the same depth
    const isTextLeaf = node.role?.value === 'StaticText' || node.role?.value === 'InlineTextBox' || node.role?.value === 'LineBreak';
    const shouldSkip = node.ignored || isTextLeaf;

    if (shouldSkip) {
      if (node.childIds) {
        for (const childId of node.childIds) {
          const child = nodeMap.get(childId);
          if (child) dfs(child, parentRef, depth);
        }
      }
      return;
    }

    // Determine ref for this node
    let ref: string;
    if (node.backendDOMNodeId !== undefined && existingRefs.has(node.backendDOMNodeId)) {
      ref = existingRefs.get(node.backendDOMNodeId)!;
      // Sync sibling counter so next new sibling doesn't collide
      // Extract parentRef and index from the existing ref
      const lastDash = ref.lastIndexOf('-');
      const existingParentRef = lastDash > 0 ? ref.substring(0, lastDash) : null;
      const existingIndex = parseInt(ref.substring(lastDash + 1), 10);
      const key = existingParentRef ?? '__root__';
      const current = siblingCounters.get(key) ?? 0;
      if (existingIndex > current) {
        siblingCounters.set(key, existingIndex);
      }
    } else if (node.backendDOMNodeId !== undefined && usedNewRefs.has(node.backendDOMNodeId)) {
      // Already assigned a new ref for this backend node in this pass
      ref = usedNewRefs.get(node.backendDOMNodeId)!;
    } else {
      ref = getNextRef(parentRef);
      if (node.backendDOMNodeId !== undefined) {
        usedNewRefs.set(node.backendDOMNodeId, ref);
      }
    }

    // Build role/name display
    const role = node.role?.value ?? 'unknown';
    const name = node.name?.value ?? '';

    // Build flags
    const flags = extractFlags(node);

    // Build properties record
    const propsRecord: Record<string, any> = {};
    if (node.properties) {
      for (const prop of node.properties) {
        propsRecord[prop.name] = prop.value?.value;
      }
    }

    // Level text value if the node has one
    const valueStr = node.value?.value ? String(node.value.value) : undefined;

    lines.push({
      ref,
      depth,
      role,
      name,
      flags: flags.join(', '),
    });

    const entry: RefEntry = {
      ref,
      backendDOMNodeId: node.backendDOMNodeId,
      nodeId: node.nodeId,
      role,
      name,
      value: valueStr,
      properties: propsRecord,
      depth,
      parentRef,
      childRefs: [],
    };

    refs.set(ref, entry);
    if (node.backendDOMNodeId !== undefined) {
      backendNodeMap.set(node.backendDOMNodeId, ref);
    }

    // Link to parent
    if (parentRef && refs.has(parentRef)) {
      refs.get(parentRef)!.childRefs.push(ref);
    }

    // Traverse children
    if (node.childIds) {
      for (const childId of node.childIds) {
        const child = nodeMap.get(childId);
        if (child) dfs(child, ref, depth + 1);
      }
    }
  }

  // DFS traverse from effective roots
  for (const root of effectiveRoots) {
    dfs(root, null, 0);
  }

  // Count ignored nodes
  const ignoredCount = nodes.filter(n => n.ignored).length;
  const elementCount = lines.length;

  return {
    lines,
    refs,
    backendNodeMap,
    elementCount,
    ignoredCount,
  };
}

/**
 * Anchor refs: read existing data-dv-ref from DOM, assign new ones to elements
 * without one, and write them back to the DOM.
 *
 * Returns a Map<backendDOMNodeId, ref> of all anchored refs.
 */
export async function anchorRefs(
  client: CDPClient,
  nodes: AXNode[],
): Promise<Map<number, string>> {
  const anchored = new Map<number, string>();
  const toAssign: Array<{ backendNodeId: number; ref: string }> = [];

  // ── Step 0: Request the document (required before pushNodesByBackendIdsToFrontend) ──
  try {
    await client.send('DOM.getDocument', { depth: -1, pierce: true });
  } catch {
    // May fail if already requested; ignore
  }

  // ── Step 1: Build tree and compute refs ──
  // First do a dry run with empty existingRefs to get the initial ref assignments
  const nodeMap = new Map<string, AXNode>();
  for (const node of nodes) nodeMap.set(node.nodeId, node);

  // Collect non-ignored nodes with backendDOMNodeId in DFS order
  const orderedNodes: AXNode[] = [];

  function collectDFS(nodeId: string) {
    const node = nodeMap.get(nodeId);
    if (!node) return;
    const isTextLeaf = node.role?.value === 'StaticText' || node.role?.value === 'InlineTextBox' || node.role?.value === 'LineBreak';
    const shouldSkip = node.ignored || isTextLeaf;
    if (shouldSkip) {
      if (node.childIds) {
        for (const cid of node.childIds) collectDFS(cid);
      }
      return;
    }
    if (node.backendDOMNodeId !== undefined) {
      orderedNodes.push(node);
    }
    if (node.childIds) {
      for (const cid of node.childIds) collectDFS(cid);
    }
  }

  // Find root nodes
  for (const node of nodes) {
    if (!node.parentId) {
      collectDFS(node.nodeId);
    } else {
      const parent = nodeMap.get(node.parentId);
      if (!parent) collectDFS(node.nodeId);
    }
  }

  // ── Step 2: Read existing data-dv-ref from DOM ──
  // We batch push nodes to frontend to read their attributes
  // But to minimize round-trips, we process in batches of 50
  const BATCH_SIZE = 50;

  for (let i = 0; i < orderedNodes.length; i += BATCH_SIZE) {
    const batch = orderedNodes.slice(i, i + BATCH_SIZE);

    // Push all backend node IDs to frontend at once
    const backendIds = batch.map(n => n.backendDOMNodeId!).filter(Boolean);
    if (backendIds.length === 0) continue;

    let nodeIds: number[];
    try {
      const result = await client.pushNodesByBackendIdsToFrontend(backendIds);
      nodeIds = result.nodeIds;
    } catch {
      continue;
    }

    // Read attributes for each node to check for existing data-dv-ref
    for (let j = 0; j < batch.length && j < nodeIds.length; j++) {
      const node = batch[j];
      const nodeId = nodeIds[j];
      if (!nodeId || node.backendDOMNodeId === undefined) continue;

      try {
        const attrs = await client.getAttributes(nodeId);
        const attrArray = attrs.attributes;
        // attributes is a flat array: [name1, value1, name2, value2, ...]
        let existingRef = '';
        for (let k = 0; k < attrArray.length; k += 2) {
          if (attrArray[k] === 'data-dv-ref') {
            existingRef = attrArray[k + 1];
            break;
          }
        }

        if (existingRef && existingRef.startsWith('@e')) {
          anchored.set(node.backendDOMNodeId, existingRef);
        }
      } catch {
        // Skip nodes we can't read
      }
    }
  }

  // ── Step 3: Assign new refs for nodes without existing ones ──
  // Re-traverse the tree, using anchored refs and generating new ones
  const siblingCounters = new Map<string, number>();

  function getNextRef(parentRef: string | null): string {
    const key = parentRef ?? '__root__';
    const next = (siblingCounters.get(key) ?? 0) + 1;
    siblingCounters.set(key, next);
    return parentRef ? `${parentRef}-${next}` : `@e${next}`;
  }

  // Pre-seed sibling counters from existing anchored refs
  for (const [, ref] of anchored) {
    const lastDash = ref.lastIndexOf('-');
    const parentRef = lastDash > 0 ? ref.substring(0, lastDash) : null;
    const index = parseInt(ref.substring(lastDash + 1), 10);
    const key = parentRef ?? '__root__';
    const current = siblingCounters.get(key) ?? 0;
    if (index > current) siblingCounters.set(key, index);
  }

  const newlyAssigned = new Map<number, string>();

  for (const node of orderedNodes) {
    const bnn = node.backendDOMNodeId!;

    // Skip if already anchored from existing data-dv-ref
    if (anchored.has(bnn)) continue;

    // Determine parent ref: find the closest non-ignored ancestor
    let parentRef: string | null = null;
    let current = node.parentId ? nodeMap.get(node.parentId) : undefined;
    while (current) {
      if (current.backendDOMNodeId !== undefined && !current.ignored) {
        // Find the ref for the parent (could be anchored or newly assigned)
        const pRef = anchored.get(current.backendDOMNodeId) ??
          newlyAssigned.get(current.backendDOMNodeId);
        if (pRef) {
          parentRef = pRef;
          break;
        }
      }
      current = current.parentId ? nodeMap.get(current.parentId) : undefined;
    }

    const newRef = getNextRef(parentRef);
    anchored.set(bnn, newRef);
    newlyAssigned.set(bnn, newRef);

    toAssign.push({ backendNodeId: bnn, ref: newRef });
  }

  // ── Step 4: Write new refs to DOM ──
  for (let i = 0; i < toAssign.length; i += BATCH_SIZE) {
    const batch = toAssign.slice(i, i + BATCH_SIZE);
    const backendIds = batch.map(n => n.backendNodeId);

    let nodeIds: number[];
    try {
      const result = await client.pushNodesByBackendIdsToFrontend(backendIds);
      nodeIds = result.nodeIds;
    } catch (e) {
      console.error(`DEBUG pushNodesByBackendIdsToFrontend (write phase) failed: ${e}`);
      continue;
    }

    for (let j = 0; j < batch.length && j < nodeIds.length; j++) {
      try {
        await client.setAttributeValue(nodeIds[j], 'data-dv-ref', batch[j].ref);
      } catch {
        // Skip failed writes
      }
    }
  }

  return anchored;
}

/**
 * Resolve a ref from a SnapshotResult.
 */
export function resolveRef(ref: string, result: SnapshotResult): RefEntry | null {
  return result.refs.get(ref) ?? null;
}

/**
 * Format snapshot lines as a displayable text tree.
 */
export function formatSnapshotLines(result: SnapshotResult): string {
  const out: string[] = [];
  out.push(chalk.bold('Accessibility Snapshot'));
  out.push('======================');

  for (const line of result.lines) {
    const indent = '  '.repeat(line.depth);
    const refStr = chalk.cyan(line.ref);
    const roleStr = chalk.yellow(line.role);
    const nameStr = line.name ? chalk.green(`"${line.name}"`) : '';
    const flagsStr = line.flags ? chalk.gray(`[${line.flags}]`) : '';

    out.push(`${indent}${refStr} ${roleStr} ${nameStr} ${flagsStr}`.trimEnd());
  }

  out.push('');
  out.push(chalk.gray(`${result.elementCount} elements (${result.ignoredCount} presentation nodes skipped)`));

  return out.join('\n');
}

/**
 * Format snapshot as JSON for programmatic consumption.
 */
/**
 * Build the plain-object form of a snapshot result, suitable for feeding to
 * any structured serializer (JSON or YAML). Kept separate from
 * `formatSnapshotJSON` so `--yaml` and `--json` render the exact same shape.
 */
export function buildSnapshotJSONObject(result: SnapshotResult): Record<string, any> {
  const refsObj: Record<string, any> = {};
  for (const [key, entry] of result.refs) {
    refsObj[key] = {
      ref: entry.ref,
      nodeId: entry.nodeId,
      backendDOMNodeId: entry.backendDOMNodeId,
      role: entry.role,
      name: entry.name,
      value: entry.value,
      properties: entry.properties,
      depth: entry.depth,
      parentRef: entry.parentRef,
      childRefs: entry.childRefs,
    };
  }

  return {
    lines: result.lines,
    refs: refsObj,
    elementCount: result.elementCount,
    ignoredCount: result.ignoredCount,
  };
}

export function formatSnapshotJSON(result: SnapshotResult): string {
  return JSON.stringify(buildSnapshotJSONObject(result), null, 2);
}
