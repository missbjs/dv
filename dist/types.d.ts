export interface Profile {
    port: number;
}
export interface ProfileConfig {
    [key: string]: Profile;
}
export interface CDPTarget {
    description: string;
    devtoolsFrontendUrl: string;
    id: string;
    title: string;
    type: string;
    url: string;
    webSocketDebuggerUrl: string;
}
export interface CDPMessage {
    id?: number;
    method?: string;
    params?: any;
    result?: any;
    error?: any;
}
export interface ConsoleMessage {
    type: string;
    text: string;
    url?: string;
    line?: number;
    column?: number;
}
/** AXValue type enumeration from CDP */
export type AXValueType = 'boolean' | 'tristate' | 'booleanOrUndefined' | 'idref' | 'idrefList' | 'integer' | 'node' | 'nodeList' | 'number' | 'string' | 'computedString' | 'token' | 'tokenList' | 'domRelation' | 'role' | 'internalRole' | 'valueUndefined';
/** AX value source — where the property value comes from */
export interface AXValueSource {
    type: string;
    value?: AXValue;
    attribute?: string;
    attributeValue?: string;
    superseded?: boolean;
    nativeSource?: string;
    nativeSourceValue?: AXValue;
    invalid?: boolean;
    invalidReason?: string;
}
/** AX value — the actual value object in the accessibility tree */
export interface AXValue {
    type: AXValueType;
    value?: any;
    relatedNodes?: AXRelatedNode[];
    sources?: AXValueSource[];
}
/** AX related node reference */
export interface AXRelatedNode {
    backendDOMNodeId: number;
    idref?: string;
    text?: string;
}
/** AX property name enumeration */
export type AXPropertyName = 'busy' | 'disabled' | 'editable' | 'focusable' | 'focused' | 'hidden' | 'hiddenRoot' | 'invalid' | 'keyshortcuts' | 'settable' | 'roledescription' | 'live' | 'atomic' | 'relevant' | 'root' | 'autocomplete' | 'hasPopup' | 'level' | 'multiselectable' | 'orientation' | 'multiline' | 'readonly' | 'required' | 'valuemin' | 'valuemax' | 'valuetext' | 'checked' | 'expanded' | 'modal' | 'pressed' | 'selected' | 'activedescendant' | 'controls' | 'describedby' | 'details' | 'errormessage' | 'flowto' | 'labelledby' | 'owns' | 'url' | 'braillelabel' | 'brailleroledescription' | 'description' | 'colcount' | 'colindex' | 'colspan' | 'rowcount' | 'rowindex' | 'rowspan' | 'spellcheck' | 'colindextext' | 'rowindextext';
/** AX property — name/value pair on an accessibility node */
export interface AXProperty {
    name: AXPropertyName;
    value: AXValue;
}
/** Accessibility node from getFullAXTree() */
export interface AXNode {
    nodeId: string;
    ignored: boolean;
    role?: {
        type: string;
        value: string;
    } | null;
    name?: {
        type: string;
        value: string;
    } | null;
    value?: {
        type: string;
        value: string;
    } | null;
    description?: {
        type: string;
        value: string;
    } | null;
    properties?: AXProperty[];
    parentId?: string;
    childIds?: string[];
    backendDOMNodeId?: number;
    frameId?: string;
}
/** Resolved ref entry — maps a ref string like "@e1-2" to its element details */
export interface RefEntry {
    ref: string;
    backendDOMNodeId?: number;
    nodeId: string;
    role: string;
    name: string;
    value?: string;
    properties?: Record<string, any>;
    /** Indentation level in the snapshot tree */
    depth: number;
    /** The ref's parent ref, or null for root-level elements */
    parentRef: string | null;
    /** Children refs in display order */
    childRefs: string[];
}
/** One line in the text snapshot output */
export interface SnapshotLine {
    ref: string;
    depth: number;
    role: string;
    name: string;
    /** Comma-separated property flags like "focusable, disabled" */
    flags: string;
}
/** Result of building the snapshot tree */
export interface SnapshotResult {
    lines: SnapshotLine[];
    refs: Map<string, RefEntry>;
    /** Backend DOM node ID to ref mapping for quick resolution */
    backendNodeMap: Map<number, string>;
    /** Number of non-ignored elements */
    elementCount: number;
    /** Number of ignored (presentational) elements skipped */
    ignoredCount: number;
}
/** Difference between two snapshots */
export interface SnapshotDiff {
    added: RefEntry[];
    removed: RefEntry[];
    changed: Array<{
        ref: string;
        before: RefEntry;
        after: RefEntry;
        changes: string[];
    }>;
    /** Elements that kept the same ref between snapshots */
    unchanged: number;
}
//# sourceMappingURL=types.d.ts.map