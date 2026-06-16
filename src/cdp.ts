import WebSocket from 'ws';
import axios from 'axios';
import { CDPMessage, CDPTarget, SessionState } from './types.js';
import { promises as fs } from 'fs';
import { join } from 'path';

const SESSION_FILE = '.dv-session.json';

export class CDPClient {
  private ws: WebSocket | null = null;
  private port: number;
  private messageId = 0;
  private pendingMessages = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
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
  private state: SessionState;

  constructor(port: number) {
    this.port = port;
    this.state = { currentPageId: null, currentProfile: null, port };
  }

  async loadState() {
    try {
      const data = await fs.readFile(SESSION_FILE, 'utf-8');
      this.state = JSON.parse(data);
      return this.state;
    } catch {
      return null;
    }
  }

  async saveState() {
    await fs.writeFile(SESSION_FILE, JSON.stringify(this.state, null, 2));
  }

  async getTargets(): Promise<CDPTarget[]> {
    try {
      const response = await axios.get(`http://localhost:${this.port}/json`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
        throw new Error(`Chrome is not running on port ${this.port}. Start it first with: dv start --port ${this.port} --headed`);
      }
      throw error;
    }
  }

  async getCurrentPage(): Promise<CDPTarget | null> {
    const targets = await this.getTargets();
    const pages = targets.filter(t => t.type === 'page');

    if (this.state.currentPageId) {
      const page = pages.find(p => p.id === this.state.currentPageId);
      if (page) return page;
    }

    // Return first page if no current page set
    if (pages.length > 0) {
      return pages[0];
    }

    return null;
  }

  async connect(pageId?: string): Promise<void> {
    const targets = await this.getTargets();
    const pages = targets.filter(t => t.type === 'page');

    let targetPage: CDPTarget | undefined;

    if (pageId) {
      targetPage = pages.find(p => p.id === pageId);
    } else if (this.state.currentPageId) {
      targetPage = pages.find(p => p.id === this.state.currentPageId);
    } else {
      targetPage = pages[0];
    }

    if (!targetPage) {
      throw new Error('No page found. Make sure Chrome is running and navigate to a page first.');
    }

    this.state.currentPageId = targetPage.id;
    await this.saveState();

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(targetPage!.webSocketDebuggerUrl);

      this.ws.on('open', () => {
        resolve();
      });

      this.ws.on('message', (data: Buffer) => {
        const message: CDPMessage = JSON.parse(data.toString());

        if (message.id !== undefined) {
          const pending = this.pendingMessages.get(message.id);
          if (pending) {
            this.pendingMessages.delete(message.id);
            if (message.error) {
              pending.reject(message.error);
            } else {
              pending.resolve(message.result);
            }
          }
        } else if (message.method === 'Console.messageAdded') {
          this.consoleMessages.push(message.params?.message);
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
        }
      });

      this.ws.on('error', (error) => {
        reject(new Error(`WebSocket error: ${error.message}`));
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
      this.pendingMessages.set(id, { resolve, reject });
      this.ws!.send(JSON.stringify(message));

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingMessages.has(id)) {
          this.pendingMessages.delete(id);
          reject(new Error('Timeout waiting for CDP response'));
        }
      }, 30000);
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

  async click(selector: string) {
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

  async close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async newPage(url: string): Promise<CDPTarget> {
    const response = await axios.put(`http://localhost:${this.port}/json/new?${url}`);
    return response.data;
  }

  async closePage(pageId: string) {
    await axios.get(`http://localhost:${this.port}/json/close/${pageId}`);
    if (this.state.currentPageId === pageId) {
      this.state.currentPageId = null;
      await this.saveState();
    }
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
  async getCookies(urls?: string[]) {
    return await this.send('Storage.getCookies', urls ? { urls } : {});
  }

  async clearCookies(browserContextId?: string) {
    await this.send('Storage.clearCookies', browserContextId ? { browserContextId } : {});
  }

  async clearDataForOrigin(origin: string, storageTypes: string) {
    await this.send('Storage.clearDataForOrigin', { origin, storageTypes });
  }

  async getStorageItems(origin: string, storageType: 'local_storage' | 'session_storage') {
    return await this.send('DOMStorage.getDOMStorageItems', {
      storageId: { origin, storageType }
    });
  }

  async setStorageItem(origin: string, storageType: 'local_storage' | 'session_storage', key: string, value: string) {
    await this.send('DOMStorage.setDOMStorageItem', {
      storageId: { origin, storageType },
      key,
      value,
    });
  }

  async removeStorageItem(origin: string, storageType: 'local_storage' | 'session_storage', key: string) {
    await this.send('DOMStorage.removeDOMStorageItem', {
      storageId: { origin, storageType },
      key,
    });
  }
}