import WebSocket from 'ws';
import axios from 'axios';
import { CDPMessage, CDPTarget } from './types.js';
import { buildElementExpression } from './utils.js';

export class CDPClient {
  private ws: WebSocket | null = null;
  private port: number;
  private messageId = 0;
  private pendingMessages = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeoutId?: NodeJS.Timeout;
  }>();
  private consoleMessages: Array<{
    type: string;
    text: string;
    url?: string;
    line?: number;
    column?: number;
  }> = [];
  private networkRequests: Array<{
    requestId: string;
    url: string;
    method: string;
    type: string;
    status?: number;
    responseHeaders?: any;
    responseBody?: string;
  }> = [];
  private requestInterceptedCallback?: (params: any) => void;

  constructor(port: number) {
    this.port = port;
  }

  async getTargets(): Promise<CDPTarget[]> {
    try {
      const response = await axios.get(`http://localhost:${this.port}/json`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'ECONNREFUSED') {
        throw new Error(`Chrome is not running on port ${this.port}. Start it first with: dv1 start`);
      }
      throw error;
    }
  }

  /** Find the first non-DevTools tab from live targets */
  getCurrentTab(targets: CDPTarget[]): CDPTarget | null {
    const tabs = targets.filter(t => t.type === 'page' && !t.url.startsWith('devtools://'));
    return tabs.length > 0 ? tabs[0] : null;
  }

  async connect(tabId?: string): Promise<void> {
    const targets = await this.getTargets();
    const tabs = targets.filter(t => t.type === 'page');

    let targetTab: CDPTarget | undefined;

    if (tabId) {
      targetTab = tabs.find(p => p.id === tabId);
    } else {
      // Default to first non-DevTools tab
      const contentTab = tabs.find(t => !t.url.startsWith('devtools://'));
      if (contentTab) {
        targetTab = contentTab;
      } else {
        targetTab = tabs[0];
      }
    }

    if (!targetTab) {
      throw new Error('No tab found. Make sure Chrome is running and a tab is open.');
    }

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(targetTab!.webSocketDebuggerUrl);

      this.ws.on('open', () => {
        resolve();
      });

      this.ws.on('message', (data: Buffer) => {
        const message: CDPMessage = JSON.parse(data.toString());

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
            } else {
              pending.resolve(message.result);
            }
          }
        } else if (message.method === 'Console.messageAdded') {
          const raw = message.params?.message;
          this.consoleMessages.push({
            type: raw.level,      // CDP uses 'level' field (error, warning, log, debug)
            text: raw.text,
            url: raw.url,
            line: raw.line,
            column: raw.column,
          });
        } else if (message.method === 'Network.requestWillBeSent') {
          this.networkRequests.push({
            requestId: message.params?.requestId,
            url: message.params?.request.url,
            method: message.params?.request.method,
            type: message.params?.type,
          });
        } else if (message.method === 'Network.responseReceived') {
          const req = this.networkRequests.find(r => r.requestId === message.params?.requestId);
          if (req) {
            req.status = message.params?.response.status;
            req.responseHeaders = message.params?.response.headers;
          }
        } else if (message.method === 'Network.requestIntercepted') {
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
          if (pending.timeoutId) clearTimeout(pending.timeoutId);
        }
        this.pendingMessages.clear();
      });
    });
  }

  async send(method: string, params?: any): Promise<any> {
    if (!this.ws) {
      throw new Error('Not connected. Call connect() first.');
    }

    const id = ++this.messageId;
    const message: CDPMessage = { id, method, params };

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
        this.ws!.send(JSON.stringify(message));
      } catch (err) {
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

  async navigate(url: string) {
    return await this.send('Page.navigate', { url });
  }

  async evaluate(expression: string) {
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
  async resolveNodeId(selector: string): Promise<number> {
    if (selector.includes('>>>')) {
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
      } finally {
        await this.send('Runtime.releaseObject', { objectId }).catch(() => {});
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

  async click(selector: string) {
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

  async fill(selector: string, value: string) {
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

  async type(selector: string, text: string) {
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

  async pressKey(key: string) {
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

  async resize(width: number, height: number) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
  }

  async reloadAndWait(waitMs: number = 3000): Promise<void> {
    // Use a single-shot listener for Page.loadEventFired — don't destroy existing handlers
    const loadPromise = new Promise<void>((resolve) => {
      const handler = (data: Buffer) => {
        const message: CDPMessage = JSON.parse(data.toString());
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
    } catch {}

    // Wait additional time for dynamic content/scripts to execute
    await new Promise(resolve => setTimeout(resolve, waitMs));
  }

  async close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async newTab(url: string): Promise<CDPTarget> {
    const encodedUrl = encodeURIComponent(url);
    const response = await axios.put(`http://localhost:${this.port}/json/new?${encodedUrl}`);
    return response.data;
  }

  async closeTab(tabId: string) {
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

  async getResponseBody(requestId: string) {
    return await this.send('Network.getResponseBody', { requestId });
  }

  async setCacheDisabled(disabled: boolean) {
    await this.send('Network.setCacheDisabled', { cacheDisabled: disabled });
  }

  async clearBrowserCache() {
    await this.send('Network.clearBrowserCache');
  }

  async setRequestInterception(patterns: any[]) {
    await this.send('Network.setRequestInterception', { patterns });
  }

  async continueInterceptedRequest(interceptionId: string, errorReason?: string) {
    await this.send('Network.continueInterceptedRequest', { interceptionId, errorReason });
  }

  // DOM Domain
  async inspectElement(selector: string) {
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

  async querySelectorAll(selector: string) {
    const document = await this.send('DOM.getDocument');
    const result = await this.send('DOM.querySelectorAll', {
      nodeId: document.root.nodeId,
      selector,
    });
    return result.nodeIds;
  }

  async getOuterHTML(nodeId: number) {
    return await this.send('DOM.getOuterHTML', { nodeId });
  }

  async setOuterHTML(nodeId: number, html: string) {
    await this.send('DOM.setOuterHTML', { nodeId, html });
  }

  async setAttributeValue(nodeId: number, name: string, value: string) {
    await this.send('DOM.setAttributeValue', { nodeId, name, value });
  }

  async setNodeValue(nodeId: number, value: string) {
    await this.send('DOM.setNodeValue', { nodeId, value });
  }

  // Emulation Domain
  async setDeviceMetricsOverride(width: number, height: number, deviceScaleFactor: number, mobile: boolean) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile,
    });
  }

  async setGeolocationOverride(latitude: number, longitude: number, accuracy: number = 100) {
    await this.send('Emulation.setGeolocationOverride', { latitude, longitude, accuracy });
  }

  async setUserAgentOverride(userAgent: string) {
    await this.send('Emulation.setUserAgentOverride', { userAgent });
  }

  async setTimezoneOverride(timezoneId: string) {
    await this.send('Emulation.setTimezoneOverride', { timezoneId });
  }

  async setNetworkConditions(offline: boolean, latency: number, downloadThroughput: number, uploadThroughput: number) {
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

  // Storage Domain
  async getCookies(urls?: string[]) {
    return await this.send('Storage.getCookies', urls ? { urls } : {});
  }

  async clearCookies(browserContextId?: string) {
    await this.send('Storage.clearCookies', browserContextId ? { browserContextId } : {});
  }

  async clearDataForOrigin(origin: string, storageTypes: string) {
    await this.send('Storage.clearDataForOrigin', { origin, storageTypes });
  }

  async getStorageItems(origin: string, isLocalStorage: boolean) {
    return await this.send('DOMStorage.getDOMStorageItems', {
      storageId: { origin, isLocalStorage }
    });
  }

  async setStorageItem(origin: string, isLocalStorage: boolean, key: string, value: string) {
    await this.send('DOMStorage.setDOMStorageItem', {
      storageId: { origin, isLocalStorage },
      key,
      value,
    });
  }

  async removeStorageItem(origin: string, isLocalStorage: boolean, key: string) {
    await this.send('DOMStorage.removeDOMStorageItem', {
      storageId: { origin, isLocalStorage },
      key,
    });
  }

  // Request interception callback
  onRequestIntercepted(callback: (params: any) => void) {
    this.requestInterceptedCallback = callback;
  }

  // ── Accessibility Domain ──

  async enableAccessibility() {
    await this.send('Accessibility.enable');
  }

  async getFullAXTree(depth?: number, frameId?: string): Promise<{ nodes: any[] }> {
    const params: any = {};
    if (depth !== undefined) params.depth = depth;
    if (frameId !== undefined) params.frameId = frameId;
    return await this.send('Accessibility.getFullAXTree', params);
  }

  async getPartialAXTree(opts: { nodeId?: number; backendNodeId?: number; objectId?: string; depth?: number; fetchRelatives?: boolean }) {
    return await this.send('Accessibility.getPartialAXTree', opts);
  }

  async queryAXTree(opts: { nodeId?: number; backendNodeId?: number; objectId?: string; accessibleName?: string; role?: string }) {
    return await this.send('Accessibility.queryAXTree', opts);
  }

  // ── DOM Backend-Node Bridge ──

  /** Push nodes by backend DOM node IDs to frontend to get nodeIds */
  async pushNodesByBackendIdsToFrontend(backendNodeIds: number[]): Promise<{ nodeIds: number[] }> {
    return await this.send('DOM.pushNodesByBackendIdsToFrontend', { backendNodeIds });
  }

  /** Get attributes for a node (used to read data-dv-ref) */
  async getAttributes(nodeId: number): Promise<{ attributes: string[] }> {
    return await this.send('DOM.getAttributes', { nodeId });
  }

  /** Get box model using backend node ID (convenience: push + getBoxModel) */
  async getBoxModelByBackendNode(backendNodeId: number): Promise<any> {
    const { nodeIds } = await this.pushNodesByBackendIdsToFrontend([backendNodeId]);
    if (!nodeIds || nodeIds.length === 0) {
      throw new Error(`Cannot resolve backend DOM node: ${backendNodeId}`);
    }
    return await this.send('DOM.getBoxModel', { nodeId: nodeIds[0] });
  }

  /** Get outer HTML using backend node ID */
  async getOuterHTMLByBackendNode(backendNodeId: number): Promise<{ outerHTML: string }> {
    const { nodeIds } = await this.pushNodesByBackendIdsToFrontend([backendNodeId]);
    if (!nodeIds || nodeIds.length === 0) {
      throw new Error(`Cannot resolve backend DOM node: ${backendNodeId}`);
    }
    return await this.send('DOM.getOuterHTML', { nodeId: nodeIds[0] });
  }

  /** Get computed text content via evaluate on a backend node */
  async getNodeTextByBackendNode(backendNodeId: number): Promise<string> {
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
  async inspectBackendNode(backendNodeId: number): Promise<{
    nodeId: number;
    attributes: string[];
    box: any;
  }> {
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
  async clickBackendNode(backendNodeId: number): Promise<void> {
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
  async fillBackendNode(backendNodeId: number, value: string): Promise<void> {
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
  async typeBackendNode(backendNodeId: number, text: string): Promise<void> {
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
  async resolveNode(nodeId: number): Promise<any> {
    return await this.send('DOM.resolveNode', { nodeId });
  }

  // ── Element Screenshot ──

  /** Get box model for a CSS selector (returns model or throws if not found) */
  async getBoxModelBySelector(selector: string): Promise<any> {
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
  async captureScreenshotWithClip(clip: { x: number; y: number; width: number; height: number; scale?: number }): Promise<any> {
    return await this.send('Page.captureScreenshot', {
      format: 'png',
      clip: { ...clip, scale: clip.scale ?? 1 },
      captureBeyondViewport: true,
    });
  }

  // ── Hover / Focus ──

  /** Get the center point of a node by its frontend nodeId */
  private async getNodeCenter(nodeId: number): Promise<{ x: number; y: number }> {
    const box = await this.send('DOM.getBoxModel', { nodeId });
    const content = box.model.content;
    return {
      x: (content[0] + content[2]) / 2,
      y: (content[1] + content[5]) / 2,
    };
  }

  /** Hover over an element by backend DOM node ID */
  async hoverBackendNode(backendNodeId: number): Promise<void> {
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
  async hoverBySelector(selector: string): Promise<void> {
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
  async focusBackendNode(backendNodeId: number): Promise<void> {
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
  async focusBySelector(selector: string): Promise<void> {
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

  async getPerformanceMetrics(): Promise<any> {
    return await this.send('Performance.getMetrics');
  }

  // ── Scroll ──

  /** Scroll an element into view by CSS or `>>>` shadow-piercing selector */
  async scrollIntoView(selector: string): Promise<void> {
    const nodeId = await this.resolveNodeId(selector);
    await this.send('DOM.scrollIntoViewIfNeeded', { nodeId });
  }

  /** Scroll the window or an element by pixel offset (element may be `>>>` shadow-piercing) */
  async scrollBy(selector: string | null, deltaX: number, deltaY: number): Promise<void> {
    let expression: string;
    if (!selector) {
      expression = `window.scrollBy(${deltaX}, ${deltaY})`;
    } else if (selector.includes('>>>')) {
      expression = `${buildElementExpression(selector)}.scrollBy(${deltaX}, ${deltaY})`;
    } else {
      expression = `document.querySelector(${JSON.stringify(selector)}).scrollBy(${deltaX}, ${deltaY})`;
    }
    await this.send('Runtime.evaluate', { expression, returnByValue: true });
  }

  // ── History ──

  async getNavigationHistory(): Promise<any> {
    return await this.send('Page.getNavigationHistory');
  }

  async navigateToHistoryEntry(entryId: number): Promise<void> {
    await this.send('Page.navigateToHistoryEntry', { entryId });
  }

  // ── Element Highlight ──

  /** Highlight an element in the browser by CSS selector (uses Overlay) */
  async highlightNode(selector: string, color: { r: number; g: number; b: number; a: number } = { r: 77, g: 144, b: 254, a: 0.6 }): Promise<void> {
    const nodeId = await this.resolveNodeId(selector);
    await this.send('Overlay.enable');
    await this.send('Overlay.highlightNode', {
      highlightConfig: { contentColor: color, showInfo: true },
      nodeId,
    });
  }

  /** Hide any active overlay highlight */
  async hideHighlight(): Promise<void> {
    await this.send('Overlay.hideHighlight');
  }

  // ── File Upload ──

  /** Set files on an <input type=file> element via backend node ID */
  async setFileInputFiles(backendNodeId: number, files: string[]): Promise<void> {
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
  async setFileInputFilesBySelector(selector: string, files: string[]): Promise<void> {
    const nodeId = await this.resolveNodeId(selector);
    await this.send('DOM.setFileInputFiles', {
      nodeId,
      files,
    });
  }

  // ── Drag & Drop ──

  /** Drag an element (source selector) to a target (target selector or x,y) */
  async dragAndDrop(sourceSelector: string, target: string | { x: number; y: number }): Promise<void> {
    const srcNodeId = await this.resolveNodeId(sourceSelector);
    await this.send('DOM.scrollIntoViewIfNeeded', { nodeId: srcNodeId });
    const srcCenter = await this.getNodeCenter(srcNodeId);

    let targetPos: { x: number; y: number };
    if (typeof target === 'string') {
      const tgtNodeId = await this.resolveNodeId(target);
      await this.send('DOM.scrollIntoViewIfNeeded', { nodeId: tgtNodeId });
      targetPos = await this.getNodeCenter(tgtNodeId);
    } else {
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

  // ── DOM Watch (MutationObserver) ──

  /** Install a MutationObserver that records mutations to window.__dvMutations */
  async installMutationObserver(): Promise<void> {
    await this.send('Runtime.evaluate', {
      expression: `
        window.__dvMutations = [];
        window.__dvObserver = null;
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
  async readMutations(): Promise<any[]> {
    const result = await this.send('Runtime.evaluate', {
      expression: `(() => { const m = window.__dvMutations || []; window.__dvMutations = []; return m; })()`,
      returnByValue: true,
    });
    return result.result?.value ?? [];
  }
}