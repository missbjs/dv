import WebSocket from 'ws';
import axios from 'axios';
export class CDPClient {
    ws = null;
    port;
    messageId = 0;
    pendingMessages = new Map();
    consoleMessages = [];
    networkRequests = [];
    requestInterceptedCallback;
    constructor(port) {
        this.port = port;
    }
    async getTargets() {
        try {
            const response = await axios.get(`http://localhost:${this.port}/json`, {
                timeout: 5000
            });
            return response.data;
        }
        catch (error) {
            if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
                throw new Error(`Chrome is not running on port ${this.port}. Start it first with: dv1 start`);
            }
            throw error;
        }
    }
    /** Find the first non-DevTools tab from live targets */
    getCurrentTab(targets) {
        const tabs = targets.filter(t => t.type === 'page' && !t.url.startsWith('devtools://'));
        return tabs.length > 0 ? tabs[0] : null;
    }
    async connect(tabId) {
        const targets = await this.getTargets();
        const tabs = targets.filter(t => t.type === 'page');
        let targetTab;
        if (tabId) {
            targetTab = tabs.find(p => p.id === tabId);
        }
        else {
            // Default to first non-DevTools tab
            const contentTab = tabs.find(t => !t.url.startsWith('devtools://'));
            if (contentTab) {
                targetTab = contentTab;
            }
            else {
                targetTab = tabs[0];
            }
        }
        if (!targetTab) {
            throw new Error('No tab found. Make sure Chrome is running and a tab is open.');
        }
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(targetTab.webSocketDebuggerUrl);
            this.ws.on('open', () => {
                resolve();
            });
            this.ws.on('message', (data) => {
                const message = JSON.parse(data.toString());
                if (message.id !== undefined) {
                    const pending = this.pendingMessages.get(message.id);
                    if (pending) {
                        this.pendingMessages.delete(message.id);
                        // Clear timeout when response arrives
                        if (pending.timeoutId) {
                            clearTimeout(pending.timeoutId);
                        }
                        if (message.error) {
                            pending.reject(message.error);
                        }
                        else {
                            pending.resolve(message.result);
                        }
                    }
                }
                else if (message.method === 'Console.messageAdded') {
                    const raw = message.params?.message;
                    this.consoleMessages.push({
                        type: raw.level, // CDP uses 'level' field (error, warning, log, debug)
                        text: raw.text,
                        url: raw.url,
                        line: raw.line,
                        column: raw.column,
                    });
                }
                else if (message.method === 'Network.requestWillBeSent') {
                    this.networkRequests.push({
                        requestId: message.params?.requestId,
                        url: message.params?.request.url,
                        method: message.params?.request.method,
                        type: message.params?.type,
                    });
                }
                else if (message.method === 'Network.responseReceived') {
                    const req = this.networkRequests.find(r => r.requestId === message.params?.requestId);
                    if (req) {
                        req.status = message.params?.response.status;
                        req.responseHeaders = message.params?.response.headers;
                    }
                }
                else if (message.method === 'Network.requestIntercepted') {
                    // Handle intercepted requests
                    if (this.requestInterceptedCallback) {
                        this.requestInterceptedCallback(message.params);
                    }
                }
            });
            this.ws.on('error', (error) => {
                reject(new Error(`WebSocket error: ${error.message}`));
            });
            // Persistent error handler for post-connection errors — rejects all pending sends
            this.ws.on('error', (error) => {
                for (const [id, pending] of this.pendingMessages) {
                    pending.reject(new Error(`WebSocket error: ${error.message}`));
                    if (pending.timeoutId)
                        clearTimeout(pending.timeoutId);
                }
                this.pendingMessages.clear();
            });
        });
    }
    async send(method, params) {
        if (!this.ws) {
            throw new Error('Not connected. Call connect() first.');
        }
        const id = ++this.messageId;
        const message = { id, method, params };
        return new Promise((resolve, reject) => {
            // Timeout after 30 seconds
            const timeoutId = setTimeout(() => {
                if (this.pendingMessages.has(id)) {
                    this.pendingMessages.delete(id);
                    reject(new Error('Timeout waiting for CDP response'));
                }
            }, 30000);
            this.pendingMessages.set(id, { resolve, reject, timeoutId });
            try {
                this.ws.send(JSON.stringify(message));
            }
            catch (err) {
                this.pendingMessages.delete(id);
                clearTimeout(timeoutId);
                reject(new Error(`WebSocket send failed: ${err instanceof Error ? err.message : err}`));
            }
        });
    }
    async enableRuntime() {
        await this.send('Runtime.enable');
    }
    async enableConsole() {
        await this.send('Console.enable');
    }
    async enablePage() {
        await this.send('Page.enable');
    }
    async navigate(url) {
        return await this.send('Page.navigate', { url });
    }
    async evaluate(expression) {
        return await this.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
        });
    }
    async getConsoleMessages() {
        return this.consoleMessages;
    }
    /** Atomically swap and return the console messages buffer, replacing with a fresh array */
    async getAndClearConsoleMessages() {
        const messages = this.consoleMessages;
        this.consoleMessages = [];
        return messages;
    }
    async clearConsoleMessages() {
        this.consoleMessages = [];
    }
    async takeSnapshot() {
        return await this.send('DOMSnapshot.captureSnapshot', {
            computedStyles: [],
            includePaintOrder: true,
            includeDOMRects: true,
        });
    }
    async takeScreenshot() {
        return await this.send('Page.captureScreenshot', {
            format: 'png',
        });
    }
    async click(selector) {
        const document = await this.send('DOM.getDocument');
        const node = await this.send('DOM.querySelector', {
            nodeId: document.root.nodeId,
            selector,
        });
        if (!node.nodeId) {
            throw new Error(`Element not found: ${selector}`);
        }
        const box = await this.send('DOM.getBoxModel', { nodeId: node.nodeId });
        const x = (box.model.content[0] + box.model.content[2]) / 2;
        const y = (box.model.content[1] + box.model.content[5]) / 2;
        await this.send('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            x,
            y,
            button: 'left',
            clickCount: 1,
        });
        await this.send('Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            x,
            y,
            button: 'left',
            clickCount: 1,
        });
    }
    async fill(selector, value) {
        await this.click(selector);
        // Clear existing value
        await this.send('Input.dispatchKeyEvent', {
            type: 'keyDown',
            key: 'a',
            code: 'KeyA',
            modifiers: 2, // Ctrl
        });
        await this.send('Input.dispatchKeyEvent', {
            type: 'keyUp',
            key: 'a',
            code: 'KeyA',
            modifiers: 2,
        });
        // Type new value
        for (const char of value) {
            await this.send('Input.dispatchKeyEvent', {
                type: 'keyDown',
                key: char,
                text: char,
            });
            await this.send('Input.dispatchKeyEvent', {
                type: 'keyUp',
                key: char,
            });
        }
    }
    async type(selector, text) {
        await this.click(selector);
        for (const char of text) {
            await this.send('Input.dispatchKeyEvent', {
                type: 'keyDown',
                key: char,
                text: char,
            });
            await this.send('Input.dispatchKeyEvent', {
                type: 'keyUp',
                key: char,
            });
        }
    }
    async pressKey(key) {
        await this.send('Input.dispatchKeyEvent', {
            type: 'keyDown',
            key,
            code: key,
        });
        await this.send('Input.dispatchKeyEvent', {
            type: 'keyUp',
            key,
            code: key,
        });
    }
    async resize(width, height) {
        await this.send('Emulation.setDeviceMetricsOverride', {
            width,
            height,
            deviceScaleFactor: 1,
            mobile: false,
        });
    }
    async reloadAndWait(waitMs = 3000) {
        // Use a single-shot listener for Page.loadEventFired — don't destroy existing handlers
        const loadPromise = new Promise((resolve) => {
            const handler = (data) => {
                const message = JSON.parse(data.toString());
                if (message.method === 'Page.loadEventFired') {
                    this.ws?.removeListener('message', handler);
                    resolve();
                }
            };
            this.ws?.on('message', handler);
        });
        await this.send('Page.enable');
        await this.send('Page.reload');
        // Wait for load event
        try {
            await loadPromise;
        }
        catch { }
        // Wait additional time for dynamic content/scripts to execute
        await new Promise(resolve => setTimeout(resolve, waitMs));
    }
    async close() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
    async newTab(url) {
        const encodedUrl = encodeURIComponent(url);
        const response = await axios.put(`http://localhost:${this.port}/json/new?${encodedUrl}`);
        return response.data;
    }
    async closeTab(tabId) {
        await axios.get(`http://localhost:${this.port}/json/close/${tabId}`);
    }
    // Network Domain
    async enableNetwork() {
        await this.send('Network.enable');
    }
    async getNetworkRequests() {
        return this.networkRequests;
    }
    async clearNetworkRequests() {
        this.networkRequests = [];
    }
    async getResponseBody(requestId) {
        return await this.send('Network.getResponseBody', { requestId });
    }
    async setCacheDisabled(disabled) {
        await this.send('Network.setCacheDisabled', { cacheDisabled: disabled });
    }
    async clearBrowserCache() {
        await this.send('Network.clearBrowserCache');
    }
    async setRequestInterception(patterns) {
        await this.send('Network.setRequestInterception', { patterns });
    }
    async continueInterceptedRequest(interceptionId, errorReason) {
        await this.send('Network.continueInterceptedRequest', { interceptionId, errorReason });
    }
    // DOM Domain
    async inspectElement(selector) {
        const document = await this.send('DOM.getDocument');
        const node = await this.send('DOM.querySelector', {
            nodeId: document.root.nodeId,
            selector,
        });
        if (!node.nodeId) {
            throw new Error(`Element not found: ${selector}`);
        }
        const attributes = await this.send('DOM.getAttributes', { nodeId: node.nodeId });
        const box = await this.send('DOM.getBoxModel', { nodeId: node.nodeId });
        return {
            nodeId: node.nodeId,
            attributes: attributes.attributes,
            box: box.model,
        };
    }
    async querySelectorAll(selector) {
        const document = await this.send('DOM.getDocument');
        const result = await this.send('DOM.querySelectorAll', {
            nodeId: document.root.nodeId,
            selector,
        });
        return result.nodeIds;
    }
    async getOuterHTML(nodeId) {
        return await this.send('DOM.getOuterHTML', { nodeId });
    }
    async setOuterHTML(nodeId, html) {
        await this.send('DOM.setOuterHTML', { nodeId, html });
    }
    async setAttributeValue(nodeId, name, value) {
        await this.send('DOM.setAttributeValue', { nodeId, name, value });
    }
    async setNodeValue(nodeId, value) {
        await this.send('DOM.setNodeValue', { nodeId, value });
    }
    // Emulation Domain
    async setDeviceMetricsOverride(width, height, deviceScaleFactor, mobile) {
        await this.send('Emulation.setDeviceMetricsOverride', {
            width,
            height,
            deviceScaleFactor,
            mobile,
        });
    }
    async setGeolocationOverride(latitude, longitude, accuracy = 100) {
        await this.send('Emulation.setGeolocationOverride', { latitude, longitude, accuracy });
    }
    async setUserAgentOverride(userAgent) {
        await this.send('Emulation.setUserAgentOverride', { userAgent });
    }
    async setTimezoneOverride(timezoneId) {
        await this.send('Emulation.setTimezoneOverride', { timezoneId });
    }
    async setNetworkConditions(offline, latency, downloadThroughput, uploadThroughput) {
        await this.send('Emulation.setNetworkConditions', {
            offline,
            latency,
            downloadThroughput,
            uploadThroughput,
        });
    }
    async clearGeolocationOverride() {
        await this.send('Emulation.clearGeolocationOverride');
    }
    // Storage Domain
    async getCookies(urls) {
        return await this.send('Storage.getCookies', urls ? { urls } : {});
    }
    async clearCookies(browserContextId) {
        await this.send('Storage.clearCookies', browserContextId ? { browserContextId } : {});
    }
    async clearDataForOrigin(origin, storageTypes) {
        await this.send('Storage.clearDataForOrigin', { origin, storageTypes });
    }
    async getStorageItems(origin, storageType) {
        return await this.send('DOMStorage.getDOMStorageItems', {
            storageId: { origin, storageType }
        });
    }
    async setStorageItem(origin, storageType, key, value) {
        await this.send('DOMStorage.setDOMStorageItem', {
            storageId: { origin, storageType },
            key,
            value,
        });
    }
    async removeStorageItem(origin, storageType, key) {
        await this.send('DOMStorage.removeDOMStorageItem', {
            storageId: { origin, storageType },
            key,
        });
    }
    // Request interception callback
    onRequestIntercepted(callback) {
        this.requestInterceptedCallback = callback;
    }
}
//# sourceMappingURL=cdp.js.map