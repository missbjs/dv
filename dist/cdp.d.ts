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
    getStorageItems(origin: string, storageType: 'local_storage' | 'session_storage'): Promise<any>;
    setStorageItem(origin: string, storageType: 'local_storage' | 'session_storage', key: string, value: string): Promise<void>;
    removeStorageItem(origin: string, storageType: 'local_storage' | 'session_storage', key: string): Promise<void>;
    onRequestIntercepted(callback: (params: any) => void): void;
}
//# sourceMappingURL=cdp.d.ts.map