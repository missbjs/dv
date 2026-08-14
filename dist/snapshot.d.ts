import { CDPClient } from './cdp.js';
import { AXNode, RefEntry, SnapshotResult } from './types.js';
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
 *
 * NOTE (TOCTOU): The AX tree is fetched once by the caller via `getFullAXTree()`,
 * then this function writes `data-dv-ref` attributes to the DOM in batches of 50.
 * If the DOM mutates between the AX snapshot and these writes (e.g. an element is
 * added/removed/reordered), the assigned refs may not correspond to the original
 * AX tree nodes. For interactive pages, consider re-fetching the AX tree after
 * anchoring so the refs and tree stay in sync.
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
/**
 * Build the plain-object form of a snapshot result, suitable for feeding to
 * any structured serializer (JSON or YAML). Kept separate from
 * `formatSnapshotJSON` so `--yaml` and `--json` render the exact same shape.
 */
export declare function buildSnapshotJSONObject(result: SnapshotResult): Record<string, any>;
export declare function formatSnapshotJSON(result: SnapshotResult): string;
//# sourceMappingURL=snapshot.d.ts.map