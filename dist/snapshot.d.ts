import { CDPClient } from './cdp.js';
import { AXNode, RefEntry, SnapshotResult } from './types.js';
/** Check if a target string is a dv ref (e.g. "@e1", "@e1-2-3") */
export declare function isRef(target: string): boolean;
/** Parse a ref string into its path segments: "@e1-2-3" → [1, 2, 3] */
export declare function parseRef(ref: string): number[];
/** Compare two refs for snapshot diff sorting */
export declare function compareRefs(a: string, b: string): number;
/**
 * Extract property flags for display in snapshot output.
 * Returns an array of human-readable flags like "focusable", "focused", "disabled".
 */
export declare function extractFlags(node: AXNode): string[];
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
export declare function buildSnapshotLines(nodes: AXNode[], existingRefs: Map<number, string>): SnapshotResult;
/**
 * Anchor refs: read existing data-dv-ref from DOM, assign new ones to elements
 * without one, and write them back to the DOM.
 *
 * Returns a Map<backendDOMNodeId, ref> of all anchored refs.
 */
export declare function anchorRefs(client: CDPClient, nodes: AXNode[]): Promise<Map<number, string>>;
/**
 * Resolve a ref from a SnapshotResult.
 */
export declare function resolveRef(ref: string, result: SnapshotResult): RefEntry | null;
/**
 * Format snapshot lines as a displayable text tree.
 */
export declare function formatSnapshotLines(result: SnapshotResult): string;
/**
 * Format snapshot as JSON for programmatic consumption.
 */
export declare function formatSnapshotJSON(result: SnapshotResult): string;
//# sourceMappingURL=snapshot.d.ts.map