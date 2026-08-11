import { CDPTarget } from './types.js';
export declare class CDPClient {
    private ws;
    private port;
    private messageId;
    private pendingMessages;
    private consoleMessages;
    private networkRequests;
    private requestInterceptedCallback?;
    constructor(port: number);
    getTargets(): Promise<CDPTarget[]>;
    /** Find the first non-DevTools tab from live targets */
    getCurrentTab(targets: CDPTarget[]): CDPTarget | null;
    connect(tabId?: string): Promise<void>;
    send(method: string, params?: any): Promise<any>;
    enableRuntime(): Promise<void>;
    enableConsole(): Promise<void>;
    enablePage(): Promise<void>;
    enableStorage(): Promise<void>;
    enableEmulation(): Promise<void>;
    navigate(url: string): Promise<any>;
    evaluate(expression: string): Promise<any>;
    getConsoleMessages(): Promise<{
        type: string;
        text: string;
        url?: string;
        line?: number;
        column?: number;
    }[]>;
    /** Atomically swap and return the console messages buffer, replacing with a fresh array */
    getAndClearConsoleMessages(): Promise<{
        type: string;
        text: string;
        url?: string;
        line?: number;
        column?: number;
    }[]>;
    clearConsoleMessages(): Promise<void>;
    takeSnapshot(): Promise<any>;
    takeScreenshot(): Promise<any>;
    /**
     * Resolve a selector to a frontend nodeId.
     *
     * Supports two forms:
     *  - Native CSS selectors → `DOM.querySelector` (single document root).
     *  - Shadow-piercing `>>>` selectors → evaluated to an element handle via
     *    `Runtime.evaluate`, then converted to a nodeId with `DOM.requestNode`.
     *
     * Throws `Element not found: <selector>` if nothing matches (including when a
     * `>>>` chain hits a missing host and the evaluation yields no element).
     */
    resolveNodeId(selector: string): Promise<number>;
    click(selector: string): Promise<void>;
    fill(selector: string, value: string): Promise<void>;
    type(selector: string, text: string): Promise<void>;
    pressKey(key: string): Promise<void>;
    resize(width: number, height: number): Promise<void>;
    reloadAndWait(waitMs?: number): Promise<void>;
    close(): Promise<void>;
    newTab(url: string): Promise<CDPTarget>;
    closeTab(tabId: string): Promise<void>;
    enableNetwork(): Promise<void>;
    getNetworkRequests(): Promise<{
        requestId: string;
        url: string;
        method: string;
        type: string;
        status?: number;
        responseHeaders?: any;
        responseBody?: string;
    }[]>;
    clearNetworkRequests(): Promise<void>;
    getResponseBody(requestId: string): Promise<any>;
    setCacheDisabled(disabled: boolean): Promise<void>;
    clearBrowserCache(): Promise<void>;
    setRequestInterception(patterns: any[]): Promise<void>;
    continueInterceptedRequest(interceptionId: string, errorReason?: string): Promise<void>;
    inspectElement(selector: string): Promise<{
        nodeId: any;
        attributes: any;
        box: any;
    }>;
    querySelectorAll(selector: string): Promise<any>;
    getOuterHTML(nodeId: number): Promise<any>;
    setOuterHTML(nodeId: number, html: string): Promise<void>;
    setAttributeValue(nodeId: number, name: string, value: string): Promise<void>;
    setNodeValue(nodeId: number, value: string): Promise<void>;
    setDeviceMetricsOverride(width: number, height: number, deviceScaleFactor: number, mobile: boolean): Promise<void>;
    setGeolocationOverride(latitude: number, longitude: number, accuracy?: number): Promise<void>;
    setUserAgentOverride(userAgent: string): Promise<void>;
    setTimezoneOverride(timezoneId: string): Promise<void>;
    setNetworkConditions(offline: boolean, latency: number, downloadThroughput: number, uploadThroughput: number): Promise<void>;
    clearGeolocationOverride(): Promise<void>;
    getCookies(urls?: string[]): Promise<any>;
    clearCookies(browserContextId?: string): Promise<void>;
    clearDataForOrigin(origin: string, storageTypes: string): Promise<void>;
    getStorageItems(origin: string, isLocalStorage: boolean): Promise<any>;
    setStorageItem(origin: string, isLocalStorage: boolean, key: string, value: string): Promise<void>;
    removeStorageItem(origin: string, isLocalStorage: boolean, key: string): Promise<void>;
    onRequestIntercepted(callback: (params: any) => void): void;
    enableAccessibility(): Promise<void>;
    getFullAXTree(depth?: number, frameId?: string): Promise<{
        nodes: any[];
    }>;
    getPartialAXTree(opts: {
        nodeId?: number;
        backendNodeId?: number;
        objectId?: string;
        depth?: number;
        fetchRelatives?: boolean;
    }): Promise<any>;
    queryAXTree(opts: {
        nodeId?: number;
        backendNodeId?: number;
        objectId?: string;
        accessibleName?: string;
        role?: string;
    }): Promise<any>;
    /** Push nodes by backend DOM node IDs to frontend to get nodeIds */
    pushNodesByBackendIdsToFrontend(backendNodeIds: number[]): Promise<{
        nodeIds: number[];
    }>;
    /** Get attributes for a node (used to read data-dv-ref) */
    getAttributes(nodeId: number): Promise<{
        attributes: string[];
    }>;
    /** Get box model using backend node ID (convenience: push + getBoxModel) */
    getBoxModelByBackendNode(backendNodeId: number): Promise<any>;
    /** Get outer HTML using backend node ID */
    getOuterHTMLByBackendNode(backendNodeId: number): Promise<{
        outerHTML: string;
    }>;
    /** Get computed text content via evaluate on a backend node */
    getNodeTextByBackendNode(backendNodeId: number): Promise<string>;
    /** Inspect element using backend node ID */
    inspectBackendNode(backendNodeId: number): Promise<{
        nodeId: number;
        attributes: string[];
        box: any;
    }>;
    /** Click element by backend node ID */
    clickBackendNode(backendNodeId: number): Promise<void>;
    /** Fill an input by backend node ID */
    fillBackendNode(backendNodeId: number, value: string): Promise<void>;
    /** Type text into element by backend node ID */
    typeBackendNode(backendNodeId: number, text: string): Promise<void>;
    /** Resolve a DOM node to its object for inspection */
    resolveNode(nodeId: number): Promise<any>;
    /** Get box model for a CSS selector (returns model or throws if not found) */
    getBoxModelBySelector(selector: string): Promise<any>;
    /** Capture screenshot clipped to a bounding box (viewport CSS coords) */
    captureScreenshotWithClip(clip: {
        x: number;
        y: number;
        width: number;
        height: number;
        scale?: number;
    }): Promise<any>;
    /** Get the center point of a node by its frontend nodeId */
    private getNodeCenter;
    /** Hover over an element by backend DOM node ID */
    hoverBackendNode(backendNodeId: number): Promise<void>;
    /** Hover over an element by CSS or `>>>` shadow-piercing selector */
    hoverBySelector(selector: string): Promise<void>;
    /** Focus an element by backend DOM node ID */
    focusBackendNode(backendNodeId: number): Promise<void>;
    /** Focus an element by CSS or `>>>` shadow-piercing selector */
    focusBySelector(selector: string): Promise<void>;
    enablePerformance(): Promise<void>;
    getPerformanceMetrics(): Promise<any>;
    /** Scroll an element into view by CSS or `>>>` shadow-piercing selector */
    scrollIntoView(selector: string): Promise<void>;
    /** Scroll the window or an element by pixel offset (element may be `>>>` shadow-piercing) */
    scrollBy(selector: string | null, deltaX: number, deltaY: number): Promise<void>;
    getNavigationHistory(): Promise<any>;
    navigateToHistoryEntry(entryId: number): Promise<void>;
    /** Highlight an element in the browser by CSS selector (uses Overlay) */
    highlightNode(selector: string, color?: {
        r: number;
        g: number;
        b: number;
        a: number;
    }): Promise<void>;
    /** Hide any active overlay highlight */
    hideHighlight(): Promise<void>;
    /** Set files on an <input type=file> element via backend node ID */
    setFileInputFiles(backendNodeId: number, files: string[]): Promise<void>;
    /** Set files on an <input type=file> element via CSS or `>>>` shadow-piercing selector */
    setFileInputFilesBySelector(selector: string, files: string[]): Promise<void>;
    /** Drag an element (source selector) to a target (target selector or x,y) */
    dragAndDrop(sourceSelector: string, target: string | {
        x: number;
        y: number;
    }): Promise<void>;
    /** Double-click an element by CSS or `>>>` shadow-piercing selector */
    dblclick(selector: string): Promise<void>;
    /** Double-click an element by backend node ID */
    dblclickBackendNode(backendNodeId: number): Promise<void>;
    /** Print the page to PDF, returns base64-encoded PDF data */
    printToPDF(options?: {
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
    }): Promise<string>;
    /** Grant clipboard read/write permissions to the current page origin */
    grantClipboardPermission(): Promise<void>;
    /** Write text to the system clipboard via navigator.clipboard.writeText */
    clipboardWriteText(text: string): Promise<void>;
    /** Read text from the system clipboard via navigator.clipboard.readText */
    clipboardReadText(): Promise<string>;
    /** Send Ctrl+C (copy) to the active element */
    clipboardCopy(): Promise<void>;
    /** Send Ctrl+V (paste) to the active element */
    clipboardPaste(): Promise<void>;
    /** Check if an element is visible (not display:none, visibility:visible, has offsetParent) */
    isVisible(selector: string): Promise<boolean>;
    /** Check if an element is enabled (not disabled) */
    isEnabled(selector: string): Promise<boolean>;
    /** Check if a checkbox/radio element is checked */
    isChecked(selector: string): Promise<boolean>;
    /** Get the value property of an input element */
    getElementValue(selector: string): Promise<string | null>;
    /** Get an attribute of an element */
    getElementAttribute(selector: string, attr: string): Promise<string | null>;
    /** Check a checkbox/radio element by CSS selector */
    check(selector: string): Promise<void>;
    /** Uncheck a checkbox/radio element by CSS selector */
    uncheck(selector: string): Promise<void>;
    /** Scroll an element into view by backend node ID */
    scrollIntoViewByBackendNode(backendNodeId: number): Promise<void>;
    /** Get computed styles of an element (optionally filter to specific properties) */
    getElementStyles(selector: string, props?: string[]): Promise<Record<string, string> | null>;
    /** Install a MutationObserver that records mutations to window.__dvMutations */
    installMutationObserver(): Promise<void>;
    /** Read accumulated mutations since last read (returns array and clears) */
    readMutations(): Promise<any[]>;
}
//# sourceMappingURL=cdp.d.ts.map