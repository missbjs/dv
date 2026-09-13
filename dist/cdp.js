import WebSocket from 'ws';
import axios from 'axios';
import chalk from 'chalk';
import { buildElementExpression, buildShadowListExpression } from './utils.js';
import { getProfileByPort } from './profiles.js';
export class CDPClient {
    ws = null;
    port;
    messageId = 0;
    pendingMessages = new Map();
    consoleMessages = [];
    networkRequests = [];
    requestInterceptedCallback;
    /** Subscribers for CDP events (keyed by method name, e.g. 'Page.loadEventFired'). */
    eventListeners = new Map();
    /** Track whether the Page domain is already enabled to avoid duplicate Page.enable. */
    pageEnabled = false;
    constructor(port) {
        this.port = port;
    }
    /** Subscribe to a CDP event (e.g. 'Page.loadEventFired'). Returns an unsubscribe fn. */
    on(method, listener) {
        let set = this.eventListeners.get(method);
        if (!set) {
            set = new Set();
            this.eventListeners.set(method, set);
        }
        set.add(listener);
        return () => {
            set.delete(listener);
            if (set.size === 0)
                this.eventListeners.delete(method);
        };
    }
    /** Remove a specific CDP event listener. */
    off(method, listener) {
        const set = this.eventListeners.get(method);
        if (set) {
            set.delete(listener);
            if (set.size === 0)
                this.eventListeners.delete(method);
        }
    }
    async getTargets() {
        try {
            const response = await axios.get(`http://localhost:${this.port}/json`, {
                timeout: 5000
            });
            return response.data;
        }
        catch (error) {
            if (error && typeof error === 'object' && 'code' in error && error.code === 'ECONNREFUSED') {
                throw new Error(`Chrome is not running on port ${this.port}. Start it first with: ${(() => { const p = getProfileByPort(this.port); return p ? p[0] : `dv`; })()} start`);
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
            // A tab id that does not match must not fall through to the default tab:
            // the command would then run against a tab the caller never named.
            if (!targetTab) {
                const bin = (() => { const p = getProfileByPort(this.port); return p ? p[0] : 'dv'; })();
                throw new Error(`No tab with ID ${tabId} on port ${this.port}. List open tabs with: ${bin} tabs`);
            }
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
                            pending.reject(new Error(message.error.message || JSON.stringify(message.error)));
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
                // Dispatch to event subscribers for any CDP method
                if (message.method) {
                    const listeners = this.eventListeners.get(message.method);
                    if (listeners) {
                        for (const listener of listeners) {
                            listener(message.params);
                        }
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
    async enableStorage() {
        await this.send('DOMStorage.enable');
    }
    async enableEmulation() {
        await this.send('Emulation.enable');
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
    /**
     * Evaluate an expression and return its value, throwing whatever the page threw.
     *
     * `evaluate()` hands back the raw CDP reply, and a thrown expression puts the failure in
     * `exceptionDetails` while leaving `result.value` undefined. Callers that read
     * `result.result?.value ?? false` therefore reported a confident `false`/`null` for an
     * expression that never ran — which is how a TypeError inside a `>>>` chain came out as
     * "not visible" rather than as an error.
     */
    async evalValue(expression) {
        const result = await this.evaluate(expression);
        if (result.exceptionDetails) {
            const details = result.exceptionDetails;
            const message = details.exception?.description ?? details.text;
            throw new Error(String(message).split(/\r?\n/)[0]);
        }
        return result.result?.value;
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
    async resolveNodeId(selector) {
        if (selector.includes('>>>')) {
            // Prime the DOM agent first. `DOM.requestNode` hands back `nodeId: 0` — not an
            // error — unless the agent already holds a node tree, and every dv command is a
            // fresh connect, so it never does. `DOM.enable` is not enough; `DOM.getDocument`
            // is what acquires the tree. `depth: 0` keeps it to the root node: we need the
            // agent primed, not the tree serialised.
            await this.send('DOM.getDocument', { depth: 0 });
            const expression = buildElementExpression(selector);
            const evalRes = await this.send('Runtime.evaluate', { expression });
            const objectId = evalRes?.result?.objectId;
            if (evalRes?.exceptionDetails || !objectId) {
                throw new Error(`Element not found: ${selector}`);
            }
            try {
                const { nodeId } = await this.send('DOM.requestNode', { objectId });
                if (!nodeId) {
                    throw new Error(`Element not found: ${selector}`);
                }
                return nodeId;
            }
            finally {
                await this.send('Runtime.releaseObject', { objectId }).catch(() => { });
            }
        }
        const document = await this.send('DOM.getDocument');
        const node = await this.send('DOM.querySelector', {
            nodeId: document.root.nodeId,
            selector,
        });
        if (!node.nodeId) {
            throw new Error(`Element not found: ${selector}`);
        }
        return node.nodeId;
    }
    async click(selector) {
        const nodeId = await this.resolveNodeId(selector);
        const box = await this.send('DOM.getBoxModel', { nodeId });
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
    /**
     * Override the viewport size. A width or height of 0 means "no override" in
     * CDP's own convention, so `resize(0, 0)` clears the override instead of
     * installing a useless one that would still govern the tab.
     */
    async resize(width, height) {
        if (!width || !height) {
            await this.clearDeviceMetricsOverride();
            return;
        }
        await this.send('Emulation.setDeviceMetricsOverride', {
            width,
            height,
            deviceScaleFactor: 1,
            mobile: false,
        });
    }
    /**
     * Navigate and wait for the load event. Same shape as reloadAndWait, and the
     * reason it exists is the same: a command that installs a session-scoped
     * override (user agent, device metrics) has to get the page loaded *before*
     * it disconnects, or the site never sees the override at all.
     */
    async navigateAndWait(url, waitMs = 1000) {
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
        if (!this.pageEnabled) {
            await this.send('Page.enable');
            this.pageEnabled = true;
        }
        await this.send('Page.navigate', { url });
        try {
            await loadPromise;
        }
        catch {
            console.warn(chalk.yellow('navigateAndWait: Page.loadEventFired not received, continuing with additional wait'));
        }
        await new Promise(resolve => setTimeout(resolve, waitMs));
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
        if (!this.pageEnabled) {
            await this.send('Page.enable');
            this.pageEnabled = true;
        }
        await this.send('Page.reload');
        // Wait for load event
        try {
            await loadPromise;
        }
        catch {
            console.warn(chalk.yellow('reloadAndWait: Page.loadEventFired not received, continuing with additional wait'));
        }
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
    /** Public accessor for the collected network events (used by `har`). */
    async getNetworkEvents() {
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
    /**
     * Resolve a selector to frontend nodeIds, piercing shadow roots for `>>>` selectors.
     *
     * `DOM.querySelectorAll` cannot see into a shadow root — handed a `>>>` selector it
     * rejects the whole thing with a bare "DOM Error while querying". So for `>>>` we
     * evaluate the match list in the page and convert each element handle with
     * `DOM.requestNode`, which needs the same `DOM.getDocument` priming as `resolveNodeId`.
     */
    async resolveNodeIds(selector) {
        if (!selector.includes('>>>')) {
            return await this.querySelectorAll(selector);
        }
        await this.send('DOM.getDocument', { depth: 0 });
        const expression = `Array.from(${buildShadowListExpression(selector)})`;
        const evalRes = await this.send('Runtime.evaluate', { expression });
        const arrayId = evalRes?.result?.objectId;
        if (evalRes?.exceptionDetails || !arrayId) {
            throw new Error(`Element not found: ${selector}`);
        }
        const elementIds = [];
        try {
            const props = await this.send('Runtime.getProperties', {
                objectId: arrayId,
                ownProperties: true,
            });
            for (const prop of props?.result ?? []) {
                // Own properties of an Array include `length` and the index keys; only the
                // latter carry an element handle.
                if (/^\d+$/.test(prop.name) && prop.value?.objectId) {
                    elementIds.push(prop.value.objectId);
                }
            }
        }
        finally {
            await this.send('Runtime.releaseObject', { objectId: arrayId }).catch(() => { });
        }
        const nodeIds = [];
        for (const objectId of elementIds) {
            try {
                const { nodeId } = await this.send('DOM.requestNode', { objectId });
                if (nodeId)
                    nodeIds.push(nodeId);
            }
            finally {
                await this.send('Runtime.releaseObject', { objectId }).catch(() => { });
            }
        }
        return nodeIds;
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
        await this.send('Network.emulateNetworkConditions', {
            offline,
            latency,
            downloadThroughput,
            uploadThroughput,
        });
    }
    async clearGeolocationOverride() {
        await this.send('Emulation.clearGeolocationOverride');
    }
    /**
     * Drop any device-metrics override and hand the tab back its real window size.
     *
     * `Emulation.clearDeviceMetricsOverride` only reverts an override installed by
     * the *same* CDP session, and every dv command is a fresh connect/close — so a
     * bare clear does nothing to the stale override that is the whole problem here
     * (verified against Chrome 152: the size survives the owning session's exit).
     * Claiming ownership first with a no-op 0x0 override — 0 means "do not override
     * this dimension", so nothing on the page moves — makes the clear effective, and
     * the restored size then persists for later sessions.
     */
    async clearDeviceMetricsOverride() {
        await this.send('Emulation.setDeviceMetricsOverride', {
            width: 0,
            height: 0,
            deviceScaleFactor: 0,
            mobile: false,
        });
        await this.send('Emulation.clearDeviceMetricsOverride');
    }
    /**
     * Restore the real user agent. CDP has no clearUserAgentOverride; an empty
     * userAgent disables the override (verified against Chrome 152).
     */
    async clearUserAgentOverride() {
        await this.send('Emulation.setUserAgentOverride', { userAgent: '' });
    }
    /**
     * Restore the host system timezone. Per the protocol, an empty timezoneId
     * disables the override rather than erroring.
     */
    async clearTimezoneOverride() {
        await this.send('Emulation.setTimezoneOverride', { timezoneId: '' });
    }
    /** Restore unthrottled networking (-1 throughput means "no limit"). */
    async clearNetworkConditions() {
        await this.setNetworkConditions(false, 0, -1, -1);
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
    async getStorageItems(origin, isLocalStorage) {
        return await this.send('DOMStorage.getDOMStorageItems', {
            storageId: { origin, isLocalStorage }
        });
    }
    async setStorageItem(origin, isLocalStorage, key, value) {
        await this.send('DOMStorage.setDOMStorageItem', {
            storageId: { origin, isLocalStorage },
            key,
            value,
        });
    }
    async removeStorageItem(origin, isLocalStorage, key) {
        await this.send('DOMStorage.removeDOMStorageItem', {
            storageId: { origin, isLocalStorage },
            key,
        });
    }
    // Request interception callback
    onRequestIntercepted(callback) {
        this.requestInterceptedCallback = callback;
    }
    // ── Accessibility Domain ──
    async enableAccessibility() {
        await this.send('Accessibility.enable');
    }
    async getFullAXTree(depth, frameId) {
        const params = {};
        if (depth !== undefined)
            params.depth = depth;
        if (frameId !== undefined)
            params.frameId = frameId;
        return await this.send('Accessibility.getFullAXTree', params);
    }
    async getPartialAXTree(opts) {
        return await this.send('Accessibility.getPartialAXTree', opts);
    }
    async queryAXTree(opts) {
        return await this.send('Accessibility.queryAXTree', opts);
    }
    // ── DOM Backend-Node Bridge ──
    /** Push nodes by backend DOM node IDs to frontend to get nodeIds */
    async pushNodesByBackendIdsToFrontend(backendNodeIds) {
        return await this.send('DOM.pushNodesByBackendIdsToFrontend', { backendNodeIds });
    }
    /** Get attributes for a node (used to read data-dv-ref) */
    async getAttributes(nodeId) {
        return await this.send('DOM.getAttributes', { nodeId });
    }
    /** Get box model using backend node ID (convenience: push + getBoxModel) */
    async getBoxModelByBackendNode(backendNodeId) {
        const { nodeIds } = await this.pushNodesByBackendIdsToFrontend([backendNodeId]);
        if (!nodeIds || nodeIds.length === 0) {
            throw new Error(`Cannot resolve backend DOM node: ${backendNodeId}`);
        }
        return await this.send('DOM.getBoxModel', { nodeId: nodeIds[0] });
    }
    /** Get outer HTML using backend node ID */
    async getOuterHTMLByBackendNode(backendNodeId) {
        const { nodeIds } = await this.pushNodesByBackendIdsToFrontend([backendNodeId]);
        if (!nodeIds || nodeIds.length === 0) {
            throw new Error(`Cannot resolve backend DOM node: ${backendNodeId}`);
        }
        return await this.send('DOM.getOuterHTML', { nodeId: nodeIds[0] });
    }
    /** Get computed text content via evaluate on a backend node */
    async getNodeTextByBackendNode(backendNodeId) {
        const { nodeIds } = await this.pushNodesByBackendIdsToFrontend([backendNodeId]);
        if (!nodeIds || nodeIds.length === 0) {
            throw new Error(`Cannot resolve backend DOM node: ${backendNodeId}`);
        }
        const result = await this.send('DOM.resolveNode', { nodeId: nodeIds[0] });
        const objectId = result.object?.objectId;
        if (!objectId) {
            throw new Error(`Cannot resolve object for node: ${nodeIds[0]}`);
        }
        const callResult = await this.send('Runtime.callFunctionOn', {
            functionDeclaration: 'function() { return this.textContent ?? ""; }',
            objectId,
            returnByValue: true,
        });
        return callResult.result?.value ?? '';
    }
    /** Inspect element using backend node ID */
    async inspectBackendNode(backendNodeId) {
        const { nodeIds } = await this.pushNodesByBackendIdsToFrontend([backendNodeId]);
        if (!nodeIds || nodeIds.length === 0) {
            throw new Error(`Cannot resolve backend DOM node: ${backendNodeId}`);
        }
        const nodeId = nodeIds[0];
        const attributes = await this.send('DOM.getAttributes', { nodeId });
        const box = await this.send('DOM.getBoxModel', { nodeId });
        return { nodeId, attributes: attributes.attributes, box: box.model };
    }
    /** Click element by backend node ID */
    async clickBackendNode(backendNodeId) {
        const { nodeIds } = await this.pushNodesByBackendIdsToFrontend([backendNodeId]);
        if (!nodeIds || nodeIds.length === 0) {
            throw new Error(`Cannot resolve backend DOM node: ${backendNodeId}`);
        }
        const nodeId = nodeIds[0];
        const box = await this.send('DOM.getBoxModel', { nodeId });
        const x = (box.model.content[0] + box.model.content[2]) / 2;
        const y = (box.model.content[1] + box.model.content[5]) / 2;
        await this.send('DOM.scrollIntoViewIfNeeded', { nodeId });
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
    /** Fill an input by backend node ID */
    async fillBackendNode(backendNodeId, value) {
        await this.clickBackendNode(backendNodeId);
        // Select all existing content
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
    /** Type text into element by backend node ID */
    async typeBackendNode(backendNodeId, text) {
        await this.clickBackendNode(backendNodeId);
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
    /** Resolve a DOM node to its object for inspection */
    async resolveNode(nodeId) {
        return await this.send('DOM.resolveNode', { nodeId });
    }
    // ── Element Screenshot ──
    /**
     * Get box model for a CSS selector (supports `>>>` shadow-piercing).
     *
     * Throws `Element not found: <selector>` when nothing matches — same as the plain-CSS
     * path below. Callers dereference `.content` directly, so returning `null` here only
     * turned a missing element into a "Cannot read properties of null" further downstream.
     */
    async getBoxModelBySelector(selector) {
        if (selector.includes('>>>')) {
            // Use resolveNodeId for shadow-piercing selectors
            const nodeId = await this.resolveNodeId(selector);
            const box = await this.send('DOM.getBoxModel', { nodeId });
            return box.model;
        }
        const document = await this.send('DOM.getDocument');
        const node = await this.send('DOM.querySelector', {
            nodeId: document.root.nodeId,
            selector,
        });
        if (!node.nodeId) {
            throw new Error(`Element not found: ${selector}`);
        }
        const box = await this.send('DOM.getBoxModel', { nodeId: node.nodeId });
        return box.model;
    }
    /** Capture screenshot clipped to a bounding box (viewport CSS coords) */
    async captureScreenshotWithClip(clip) {
        return await this.send('Page.captureScreenshot', {
            format: 'png',
            clip: { ...clip, scale: clip.scale ?? 1 },
            captureBeyondViewport: true,
        });
    }
    // ── Hover / Focus ──
    /** Get the center point of a node by its frontend nodeId */
    async getNodeCenter(nodeId) {
        const box = await this.send('DOM.getBoxModel', { nodeId });
        const content = box.model.content;
        return {
            x: (content[0] + content[2]) / 2,
            y: (content[1] + content[5]) / 2,
        };
    }
    /** Hover over an element by backend DOM node ID */
    async hoverBackendNode(backendNodeId) {
        const { nodeIds } = await this.pushNodesByBackendIdsToFrontend([backendNodeId]);
        if (!nodeIds || nodeIds.length === 0) {
            throw new Error(`Cannot resolve backend DOM node: ${backendNodeId}`);
        }
        const nodeId = nodeIds[0];
        await this.send('DOM.scrollIntoViewIfNeeded', { nodeId });
        const { x, y } = await this.getNodeCenter(nodeId);
        await this.send('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x,
            y,
            button: 'none',
        });
    }
    /** Hover over an element by CSS or `>>>` shadow-piercing selector */
    async hoverBySelector(selector) {
        const nodeId = await this.resolveNodeId(selector);
        await this.send('DOM.scrollIntoViewIfNeeded', { nodeId });
        const { x, y } = await this.getNodeCenter(nodeId);
        await this.send('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x,
            y,
            button: 'none',
        });
    }
    /** Focus an element by backend DOM node ID */
    async focusBackendNode(backendNodeId) {
        const { nodeIds } = await this.pushNodesByBackendIdsToFrontend([backendNodeId]);
        if (!nodeIds || nodeIds.length === 0) {
            throw new Error(`Cannot resolve backend DOM node: ${backendNodeId}`);
        }
        const nodeId = nodeIds[0];
        const result = await this.send('DOM.resolveNode', { nodeId });
        const objectId = result.object?.objectId;
        if (!objectId) {
            throw new Error(`Cannot resolve object for node: ${nodeId}`);
        }
        await this.send('Runtime.callFunctionOn', {
            functionDeclaration: 'function() { this.focus(); }',
            objectId,
        });
    }
    /** Focus an element by CSS or `>>>` shadow-piercing selector */
    async focusBySelector(selector) {
        const nodeId = await this.resolveNodeId(selector);
        const result = await this.send('DOM.resolveNode', { nodeId });
        const objectId = result.object?.objectId;
        if (!objectId) {
            throw new Error(`Cannot resolve object for node: ${nodeId}`);
        }
        await this.send('Runtime.callFunctionOn', {
            functionDeclaration: 'function() { this.focus(); }',
            objectId,
        });
    }
    // ── Performance ──
    async enablePerformance() {
        await this.send('Performance.enable');
    }
    async getPerformanceMetrics() {
        return await this.send('Performance.getMetrics');
    }
    // ── Scroll ──
    /** Scroll an element into view by CSS or `>>>` shadow-piercing selector */
    async scrollIntoView(selector, options) {
        if (options?.behavior || options?.block || options?.inline) {
            const opts = JSON.stringify({ behavior: options.behavior ?? 'auto', block: options.block ?? 'nearest', inline: options.inline ?? 'nearest' });
            const ok = await this.evalValue(`(() => { const el = ${buildElementExpression(selector)}; if (!el) return false; el.scrollIntoView(${opts}); return true; })()`);
            if (ok !== true)
                throw new Error(`Element not found: ${selector}`);
            return;
        }
        const nodeId = await this.resolveNodeId(selector);
        await this.send('DOM.scrollIntoViewIfNeeded', { nodeId });
    }
    /** Scroll the window or an element by pixel offset (element may be `>>>` shadow-piercing) */
    async scrollBy(selector, deltaX, deltaY) {
        if (!selector) {
            await this.evalValue(`window.scrollBy(${deltaX}, ${deltaY})`);
            return;
        }
        const el = buildElementExpression(selector);
        const ok = await this.evalValue(`(() => { const el = ${el}; if (!el) return false; el.scrollBy(${deltaX}, ${deltaY}); return true; })()`);
        if (ok !== true)
            throw new Error(`Element not found: ${selector}`);
    }
    // ── History ──
    async getNavigationHistory() {
        return await this.send('Page.getNavigationHistory');
    }
    async navigateToHistoryEntry(entryId) {
        await this.send('Page.navigateToHistoryEntry', { entryId });
    }
    // ── Element Highlight ──
    /** Highlight an element in the browser by CSS selector (uses Overlay) */
    async highlightNode(selector, color = { r: 77, g: 144, b: 254, a: 0.6 }) {
        const nodeId = await this.resolveNodeId(selector);
        await this.send('Overlay.enable');
        await this.send('Overlay.highlightNode', {
            highlightConfig: { contentColor: color, showInfo: true },
            nodeId,
        });
    }
    /** Hide any active overlay highlight */
    async hideHighlight() {
        await this.send('Overlay.hideHighlight');
    }
    // ── File Upload ──
    /** Set files on an <input type=file> element via backend node ID */
    async setFileInputFiles(backendNodeId, files) {
        const { nodeIds } = await this.pushNodesByBackendIdsToFrontend([backendNodeId]);
        if (!nodeIds || nodeIds.length === 0) {
            throw new Error(`Cannot resolve backend DOM node: ${backendNodeId}`);
        }
        await this.send('DOM.setFileInputFiles', {
            nodeId: nodeIds[0],
            files,
        });
    }
    /** Set files on an <input type=file> element via CSS or `>>>` shadow-piercing selector */
    async setFileInputFilesBySelector(selector, files) {
        const nodeId = await this.resolveNodeId(selector);
        await this.send('DOM.setFileInputFiles', {
            nodeId,
            files,
        });
    }
    // ── Drag & Drop ──
    /** Drag an element (source selector) to a target (target selector or x,y) */
    async dragAndDrop(sourceSelector, target) {
        const srcNodeId = await this.resolveNodeId(sourceSelector);
        await this.send('DOM.scrollIntoViewIfNeeded', { nodeId: srcNodeId });
        const srcCenter = await this.getNodeCenter(srcNodeId);
        let targetPos;
        if (typeof target === 'string') {
            const tgtNodeId = await this.resolveNodeId(target);
            await this.send('DOM.scrollIntoViewIfNeeded', { nodeId: tgtNodeId });
            targetPos = await this.getNodeCenter(tgtNodeId);
        }
        else {
            targetPos = target;
        }
        // Mouse down at source
        await this.send('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            x: srcCenter.x,
            y: srcCenter.y,
            button: 'left',
            clickCount: 1,
        });
        // Move in steps to trigger drag events
        const steps = 8;
        for (let i = 1; i <= steps; i++) {
            const x = srcCenter.x + ((targetPos.x - srcCenter.x) * i) / steps;
            const y = srcCenter.y + ((targetPos.y - srcCenter.y) * i) / steps;
            await this.send('Input.dispatchMouseEvent', {
                type: 'mouseMoved',
                x,
                y,
                button: 'left',
                buttons: 1,
            });
        }
        // Mouse up at target
        await this.send('Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            x: targetPos.x,
            y: targetPos.y,
            button: 'left',
            clickCount: 1,
        });
    }
    // ── Double Click ──
    /** Double-click an element by CSS or `>>>` shadow-piercing selector */
    async dblclick(selector) {
        const nodeId = await this.resolveNodeId(selector);
        const box = await this.send('DOM.getBoxModel', { nodeId });
        const x = (box.model.content[0] + box.model.content[2]) / 2;
        const y = (box.model.content[1] + box.model.content[5]) / 2;
        await this.send('Input.dispatchMouseEvent', {
            type: 'mousePressed', x, y, button: 'left', clickCount: 2,
        });
        await this.send('Input.dispatchMouseEvent', {
            type: 'mouseReleased', x, y, button: 'left', clickCount: 2,
        });
    }
    /** Double-click an element by backend node ID */
    async dblclickBackendNode(backendNodeId) {
        const { nodeIds } = await this.pushNodesByBackendIdsToFrontend([backendNodeId]);
        if (!nodeIds || nodeIds.length === 0) {
            throw new Error(`Cannot resolve backend DOM node: ${backendNodeId}`);
        }
        const nodeId = nodeIds[0];
        const box = await this.send('DOM.getBoxModel', { nodeId });
        const x = (box.model.content[0] + box.model.content[2]) / 2;
        const y = (box.model.content[1] + box.model.content[5]) / 2;
        await this.send('DOM.scrollIntoViewIfNeeded', { nodeId });
        await this.send('Input.dispatchMouseEvent', {
            type: 'mousePressed', x, y, button: 'left', clickCount: 2,
        });
        await this.send('Input.dispatchMouseEvent', {
            type: 'mouseReleased', x, y, button: 'left', clickCount: 2,
        });
    }
    // ── PDF ──
    /** Print the page to PDF, returns base64-encoded PDF data */
    async printToPDF(options) {
        const result = await this.send('Page.printToPDF', {
            landscape: false,
            printBackground: true,
            paperWidth: 8.5,
            paperHeight: 11,
            marginTop: 0.4,
            marginBottom: 0.4,
            marginLeft: 0.4,
            marginRight: 0.4,
            ...options,
        });
        return result.data;
    }
    // ── Clipboard ──
    /** Grant clipboard read/write permissions to the current page origin */
    async grantClipboardPermission() {
        try {
            // Derive origin from current URL
            const result = await this.evaluate('location.origin');
            const origin = result.result?.value ?? '';
            if (origin) {
                await this.send('Browser.grantPermissions', {
                    origin,
                    permissions: ['clipboardRead', 'clipboardWrite'],
                });
            }
        }
        catch {
            console.warn(chalk.yellow('grantClipboardPermission: could not grant permissions (may already be granted)'));
        }
    }
    /** Write text to the system clipboard via navigator.clipboard.writeText */
    async clipboardWriteText(text) {
        await this.grantClipboardPermission();
        await this.evaluate(`navigator.clipboard.writeText(${JSON.stringify(text)})`);
    }
    /** Read text from the system clipboard via navigator.clipboard.readText */
    async clipboardReadText() {
        await this.grantClipboardPermission();
        const result = await this.evaluate(`(async () => { try { return await navigator.clipboard.readText(); } catch { return ''; } })()`);
        return result.result?.value ?? '';
    }
    /** Send Ctrl+C (copy) to the active element */
    async clipboardCopy() {
        await this.send('Input.dispatchKeyEvent', {
            type: 'rawKeyDown', key: 'c', code: 'KeyC',
            windowsVirtualKeyCode: 67, modifiers: 2,
        });
        await this.send('Input.dispatchKeyEvent', {
            type: 'keyUp', key: 'c', code: 'KeyC', modifiers: 2,
        });
    }
    /** Send Ctrl+V (paste) to the active element */
    async clipboardPaste() {
        await this.send('Input.dispatchKeyEvent', {
            type: 'rawKeyDown', key: 'v', code: 'KeyV',
            windowsVirtualKeyCode: 86, modifiers: 2,
        });
        await this.send('Input.dispatchKeyEvent', {
            type: 'keyUp', key: 'v', code: 'KeyV', modifiers: 2,
        });
    }
    // ── Element State Queries (via evaluate) ──
    /** Check if an element is visible (not display:none, visibility:visible, has offsetParent) */
    async isVisible(selector) {
        const value = await this.evalValue(`(() => { const el = ${buildElementExpression(selector)}; if (!el) return null; const style = getComputedStyle(el); return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'; })()`);
        return value ?? false;
    }
    /** Check if an element is enabled (not disabled) */
    async isEnabled(selector) {
        const value = await this.evalValue(`(() => { const el = ${buildElementExpression(selector)}; return el ? !el.disabled : null; })()`);
        return value ?? false;
    }
    /** Check if a checkbox/radio element is checked */
    async isChecked(selector) {
        const value = await this.evalValue(`(() => { const el = ${buildElementExpression(selector)}; return el ? !!(el.checked ?? el.getAttribute('aria-checked') === 'true') : null; })()`);
        return value ?? false;
    }
    /** Get the value property of an input element */
    async getElementValue(selector) {
        const value = await this.evalValue(`(() => { const el = ${buildElementExpression(selector)}; return el ? (el.value ?? '') : null; })()`);
        return value ?? null;
    }
    /** Get an attribute of an element */
    async getElementAttribute(selector, attr) {
        const value = await this.evalValue(`(() => { const el = ${buildElementExpression(selector)}; return el ? el.getAttribute(${JSON.stringify(attr)}) : null; })()`);
        return value ?? null;
    }
    /** Check a checkbox/radio element by CSS selector */
    async check(selector) {
        const ok = await this.evalValue(`(() => { const el = ${buildElementExpression(selector)}; if (!el) return false; el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
        if (ok !== true)
            throw new Error(`Element not found: ${selector}`);
    }
    /** Uncheck a checkbox/radio element by CSS selector */
    async uncheck(selector) {
        const ok = await this.evalValue(`(() => { const el = ${buildElementExpression(selector)}; if (!el) return false; el.checked = false; el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
        if (ok !== true)
            throw new Error(`Element not found: ${selector}`);
    }
    /** Scroll an element into view by backend node ID */
    async scrollIntoViewByBackendNode(backendNodeId) {
        const { nodeIds } = await this.pushNodesByBackendIdsToFrontend([backendNodeId]);
        if (!nodeIds || nodeIds.length === 0) {
            throw new Error(`Cannot resolve backend DOM node: ${backendNodeId}`);
        }
        await this.send('DOM.scrollIntoViewIfNeeded', { nodeId: nodeIds[0] });
    }
    /** Get computed styles of an element (optionally filter to specific properties) */
    async getElementStyles(selector, props) {
        const propsExpr = props && props.length > 0
            ? JSON.stringify(props)
            : '[...cs]';
        const value = await this.evalValue(`(() => { const el = ${buildElementExpression(selector)}; if (!el) return null; const cs = getComputedStyle(el); return Object.fromEntries(${propsExpr}.map(p => [p, cs.getPropertyValue(p)])); })()`);
        return value ?? null;
    }
    // ── DOM Watch (MutationObserver) ──
    /** Install a MutationObserver that records mutations to window.__dvMutations */
    async installMutationObserver() {
        await this.send('Runtime.evaluate', {
            expression: `
        window.__dvMutations = [];
        if (window.__dvObserver) { window.__dvObserver.disconnect(); }
        window.__dvObserver = new MutationObserver(function(muts) {
          for (const m of muts) {
            window.__dvMutations.push({
              type: m.type,
              target: m.target.nodeName + (m.target.className ? '.' + m.target.className : ''),
              added: m.addedNodes.length,
              removed: m.removedNodes.length,
              attr: m.attributeName || null,
              time: Date.now()
            });
          }
        });
        window.__dvObserver.observe(document.documentElement, {
          childList: true, subtree: true, attributes: true, characterData: true
        });
        true
      `,
            returnByValue: true,
        });
    }
    /** Read accumulated mutations since last read (returns array and clears) */
    async readMutations() {
        const result = await this.send('Runtime.evaluate', {
            expression: `(() => { const m = window.__dvMutations || []; window.__dvMutations = []; return m; })()`,
            returnByValue: true,
        });
        return result.result?.value ?? [];
    }
}
//# sourceMappingURL=cdp.js.map