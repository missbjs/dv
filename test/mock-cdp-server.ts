import { WebSocketServer } from 'ws';
import http from 'http';
import { CDPMessage, CDPTarget } from '../src/types.js';

/**
 * Mock CDP Server for testing without real Chrome.
 * Serves HTTP on /json for target discovery and WebSocket for CDP commands.
 */
export class MockCDPServer {
  private server: http.Server | null = null;
  private wsServer: WebSocket.Server | null = null;
  private port: number;
  private connections: WebSocket[] = [];
  private messageHandlers: Map<string, (params: any) => any> = new Map();

  constructor(port: number) {
    this.port = port;
    this.setupDefaultHandlers();
  }

  private setupDefaultHandlers() {
    // Runtime.enable
    this.messageHandlers.set('Runtime.enable', () => ({}));

    // Console.enable
    this.messageHandlers.set('Console.enable', () => ({}));

    // Page.enable
    this.messageHandlers.set('Page.enable', () => ({}));

    // Network.enable
    this.messageHandlers.set('Network.enable', () => ({}));

    // DOM.getDocument
    this.messageHandlers.set('DOM.getDocument', () => ({
      root: {
        nodeId: 1,
        nodeName: 'HTML',
        nodeValue: '',
        children: [
          {
            nodeId: 2,
            nodeName: 'HEAD',
            nodeValue: '',
            children: [],
          },
          {
            nodeId: 3,
            nodeName: 'BODY',
            nodeValue: '',
            children: [
              {
                nodeId: 4,
                nodeName: 'DIV',
                nodeValue: '',
                attributes: ['id', 'test-element'],
                children: [],
              },
            ],
          },
        ],
      },
    }));

    // DOM.querySelector
    this.messageHandlers.set('DOM.querySelector', (params: any) => ({
      nodeId: params.selector === '#nonexistent' ? undefined : 4,
    }));

    // DOM.querySelectorAll
    this.messageHandlers.set('DOM.querySelectorAll', () => ({
      nodeIds: [4, 5, 6],
    }));

    // DOM.getBoxModel
    this.messageHandlers.set('DOM.getBoxModel', () => ({
      model: {
        content: [0, 0, 100, 0, 100, 100, 0, 100],
      },
    }));

    // DOM.getAttributes
    this.messageHandlers.set('DOM.getAttributes', () => ({
      attributes: ['id', 'test-element', 'class', 'test-class'],
    }));

    // DOM.getOuterHTML
    this.messageHandlers.set('DOM.getOuterHTML', () => ({
      outerHTML: '<div id="test-element" class="test-class">Test Content</div>',
    }));

    // Runtime.evaluate
    this.messageHandlers.set('Runtime.evaluate', (params: any) => ({
      result: {
        type: 'string',
        value: `Evaluated: ${params.expression}`,
      },
    }));

    // Page.navigate
    this.messageHandlers.set('Page.navigate', (params: any) => ({
      frameId: 'main',
      loaderId: 'loader-1',
    }));

    // Page.captureScreenshot
    this.messageHandlers.set('Page.captureScreenshot', () => ({
      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    }));

    // DOMSnapshot.captureSnapshot
    this.messageHandlers.set('DOMSnapshot.captureSnapshot', () => ({
      documents: [
        {
          nodes: {
            nodeType: [1, 1, 1],
            nodeName: ['HTML', 'HEAD', 'BODY'],
            nodeValue: ['', '', ''],
          },
        },
      ],
    }));

    // Input.dispatchMouseEvent
    this.messageHandlers.set('Input.dispatchMouseEvent', () => ({}));

    // Input.dispatchKeyEvent
    this.messageHandlers.set('Input.dispatchKeyEvent', () => ({}));

    // Emulation.setDeviceMetricsOverride
    this.messageHandlers.set('Emulation.setDeviceMetricsOverride', () => ({}));

    // Storage.getCookies
    this.messageHandlers.set('Storage.getCookies', () => ({
      cookies: [
        { name: 'session', value: 'abc123', domain: 'example.com' },
        { name: 'token', value: 'xyz789', domain: 'example.com' },
      ],
    }));

    // Network.getResponseBody
    this.messageHandlers.set('Network.getResponseBody', () => ({
      body: '{"status":"ok","data":"test response"}',
      base64Encoded: false,
    }));

    // Network.setCacheDisabled
    this.messageHandlers.set('Network.setCacheDisabled', () => ({}));

    // Network.clearBrowserCache
    this.messageHandlers.set('Network.clearBrowserCache', () => ({}));

    // Network.setRequestInterception
    this.messageHandlers.set('Network.setRequestInterception', () => ({}));

    // Network.continueInterceptedRequest
    this.messageHandlers.set('Network.continueInterceptedRequest', () => ({}));

    // ── Accessibility Domain ──
    this.messageHandlers.set('Accessibility.enable', () => ({}));

    this.messageHandlers.set('Accessibility.getFullAXTree', () => ({
      nodes: [
        {
          nodeId: 'a0',
          ignored: true,
          role: { type: 'role', value: 'RootWebArea' },
          childIds: ['a1', 'a4'],
        },
        {
          nodeId: 'a1',
          ignored: false,
          role: { type: 'role', value: 'navigation' },
          name: { type: 'string', value: 'Main Navigation' },
          childIds: ['a2', 'a3'],
          parentId: 'a0',
          backendDOMNodeId: 10,
          properties: [
            { name: 'focusable', value: { type: 'boolean', value: true } },
          ],
        },
        {
          nodeId: 'a2',
          ignored: false,
          role: { type: 'role', value: 'link' },
          name: { type: 'string', value: 'Home' },
          parentId: 'a1',
          backendDOMNodeId: 11,
          properties: [
            { name: 'focusable', value: { type: 'boolean', value: true } },
          ],
        },
        {
          nodeId: 'a3',
          ignored: false,
          role: { type: 'role', value: 'link' },
          name: { type: 'string', value: 'About' },
          parentId: 'a1',
          backendDOMNodeId: 12,
          properties: [
            { name: 'focusable', value: { type: 'boolean', value: true } },
            { name: 'focused', value: { type: 'boolean', value: true } },
          ],
        },
        {
          nodeId: 'a4',
          ignored: false,
          role: { type: 'role', value: 'main' },
          childIds: ['a5', 'a6'],
          parentId: 'a0',
          backendDOMNodeId: 20,
        },
        {
          nodeId: 'a5',
          ignored: false,
          role: { type: 'role', value: 'heading' },
          name: { type: 'string', value: 'Welcome' },
          parentId: 'a4',
          backendDOMNodeId: 21,
          properties: [
            { name: 'level', value: { type: 'integer', value: 1 } },
          ],
        },
        {
          nodeId: 'a6',
          ignored: false,
          role: { type: 'role', value: 'button' },
          name: { type: 'string', value: 'Submit' },
          parentId: 'a4',
          backendDOMNodeId: 22,
          properties: [
            { name: 'focusable', value: { type: 'boolean', value: true } },
            { name: 'disabled', value: { type: 'boolean', value: false } },
          ],
        },
      ],
    }));

    this.messageHandlers.set('Accessibility.getPartialAXTree', () => ({
      nodes: [],
    }));

    this.messageHandlers.set('Accessibility.queryAXTree', () => ({
      nodes: [],
    }));

    // ── DOM Backend-Node Bridge ──
    this.messageHandlers.set('DOM.pushNodesByBackendIdsToFrontend', (params: any) => {
      const backendIds: number[] = params.backendNodeIds || [];
      return {
        nodeIds: backendIds.map((id) => id + 100), // simple mapping: backend 10 → nodeId 110
      };
    });

    this.messageHandlers.set('DOM.getAttributes', () => ({
      attributes: ['data-dv-ref', '@e1', 'class', 'test-class', 'id', 'test-element'],
    }));

    this.messageHandlers.set('DOM.setAttributeValue', () => ({}));

    this.messageHandlers.set('DOM.scrollIntoViewIfNeeded', () => ({}));

    this.messageHandlers.set('DOM.resolveNode', () => ({
      object: { objectId: 'mock-object-1' },
    }));

    this.messageHandlers.set('Runtime.callFunctionOn', (params: any) => {
      if (params.functionDeclaration?.includes('textContent')) {
        return { result: { type: 'string', value: 'Test Content' } };
      }
      return { result: { type: 'undefined' } };
    });

    // ── Emulation overrides ──
    this.messageHandlers.set('Emulation.setGeolocationOverride', () => ({}));
    this.messageHandlers.set('Emulation.clearGeolocationOverride', () => ({}));
    this.messageHandlers.set('Emulation.setTimezoneOverride', () => ({}));
    this.messageHandlers.set('Emulation.setUserAgentOverride', () => ({}));

    // ── Network conditions ──
    this.messageHandlers.set('Network.emulateNetworkConditions', () => ({}));

    // ── Storage clearing ──
    this.messageHandlers.set('Storage.clearCookies', () => ({}));
    this.messageHandlers.set('Storage.clearDataForOrigin', () => ({}));

    // ── DOM mutation ──
    this.messageHandlers.set('DOM.setOuterHTML', () => ({}));
    this.messageHandlers.set('DOM.setNodeValue', () => ({}));
    this.messageHandlers.set('DOM.setFileInputFiles', () => ({}));

    // ── Additional domain enables ──
    this.messageHandlers.set('DOMStorage.enable', () => ({}));
    this.messageHandlers.set('Emulation.enable', () => ({}));
    this.messageHandlers.set('Performance.enable', () => ({}));

    // ── Performance metrics ──
    this.messageHandlers.set('Performance.getMetrics', () => ({
      metrics: [
        { name: 'Timestamp', value: 123456.789 },
        { name: 'JSHeapUsedSize', value: 5_000_000 },
        { name: 'Nodes', value: 240 },
      ],
    }));

    // ── Page reload / navigation history ──
    // Page.reload fires a delayed Page.loadEventFired so reloadAndWait() resolves.
    this.messageHandlers.set('Page.reload', () => {
      setTimeout(() => {
        this.connections.forEach((ws) => {
          if (ws.readyState === 1) {
            ws.send(JSON.stringify({ method: 'Page.loadEventFired', params: { timestamp: 1 } }));
          }
        });
      }, 10);
      return {};
    });
    this.messageHandlers.set('Page.getNavigationHistory', () => ({
      currentIndex: 1,
      entries: [
        { id: 0, url: 'https://example.com', title: 'Home' },
        { id: 1, url: 'https://example.com/about', title: 'About' },
      ],
    }));
    this.messageHandlers.set('Page.navigateToHistoryEntry', () => ({}));

    // ── DOM storage items ──
    this.messageHandlers.set('DOMStorage.getDOMStorageItems', () => ({
      entries: [
        ['theme', 'dark'],
        ['token', 'abc123'],
      ],
    }));
    this.messageHandlers.set('DOMStorage.setDOMStorageItem', () => ({}));
    this.messageHandlers.set('DOMStorage.removeDOMStorageItem', () => ({}));

    // ── Overlay (element highlight) ──
    this.messageHandlers.set('Overlay.enable', () => ({}));
    this.messageHandlers.set('Overlay.highlightNode', () => ({}));
    this.messageHandlers.set('Overlay.hideHighlight', () => ({}));
  }

  /** Reset all handlers back to defaults — call between tests to avoid cross-test pollution */
  reset() {
    this.messageHandlers.clear();
    this.setupDefaultHandlers();
  }

  /**
   * Set custom handler for a CDP method
   */
  setHandler(method: string, handler: (params: any) => any) {
    this.messageHandlers.set(method, handler);
  }

  /**
   * Start the mock CDP server (HTTP + WebSocket)
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create HTTP server for /json target discovery
      this.server = http.createServer((req, res) => {
        const url = req.url || '';
        if (url === '/json' || url === '/json/version') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(createMockTargets(this.port)));
        } else if (url.startsWith('/json/new')) {
          // newTab: target URL is the query string after '?'
          const q = url.indexOf('?');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              id: 'new-tab-1',
              type: 'page',
              title: 'New Tab',
              url: q >= 0 ? decodeURIComponent(url.slice(q + 1)) : 'about:blank',
              webSocketDebuggerUrl: `ws://localhost:${this.port}/devtools/page/new-tab-1`,
            })
          );
        } else if (url.startsWith('/json/close/')) {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Target is closing');
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      // Attach WebSocket server to the same HTTP server
      this.wsServer = new WebSocketServer({ server: this.server });

      this.wsServer.on('connection', (ws) => {
        this.connections.push(ws);

        ws.on('message', async (data: Buffer) => {
          try {
            const message: CDPMessage = JSON.parse(data.toString());
            const response = await this.handleMessage(message);
            ws.send(JSON.stringify(response));
          } catch (error) {
            ws.send(
              JSON.stringify({
                id: 0,
                error: { message: 'Invalid message format' },
              })
            );
          }
        });

        ws.on('close', () => {
          this.connections = this.connections.filter((c) => c !== ws);
        });
      });

      this.server.listen(this.port, () => {
        resolve();
      });

      this.server.on('error', (error) => {
        reject(error);
      });
    });
  }

  private async handleMessage(message: CDPMessage): Promise<CDPMessage> {
    if (message.id === undefined || !message.method) {
      return { id: message.id || 0, error: { message: 'Invalid message' } };
    }

    const handler = this.messageHandlers.get(message.method);
    if (!handler) {
      return {
        id: message.id,
        error: { message: `Method not implemented: ${message.method}` },
      };
    }

    try {
      const result = await handler(message.params);
      return { id: message.id, result };
    } catch (error: any) {
      return { id: message.id, error: { message: error.message } };
    }
  }

  /**
   * Stop the mock CDP server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }

      // Close all connections
      this.connections.forEach((ws) => ws.close());
      this.connections = [];

      // Close WebSocket server
      this.wsServer?.close();

      // Close HTTP server
      this.server.close(() => {
        this.server = null;
        this.wsServer = null;
        resolve();
      });
    });
  }

  /**
   * Simulate console message event
   */
  broadcastConsoleMessage(type: string, text: string) {
    const message = {
      method: 'Console.messageAdded',
      params: {
        // Real CDP Console.messageAdded carries the severity in `level`; the
        // client reads `raw.level`, so mirror that here (not `type`).
        message: { level: type, text },
      },
    };

    this.connections.forEach((ws) => {
      ws.send(JSON.stringify(message));
    });
  }

  /**
   * Simulate network request event
   */
  broadcastNetworkRequest(requestId: string, url: string, method: string) {
    const message = {
      method: 'Network.requestWillBeSent',
      params: {
        requestId,
        request: { url, method },
        type: 'Document',
      },
    };

    this.connections.forEach((ws) => {
      ws.send(JSON.stringify(message));
    });
  }

  /**
   * Simulate request intercepted event
   */
  broadcastRequestIntercepted(interceptionId: string, url: string) {
    const message = {
      method: 'Network.requestIntercepted',
      params: {
        interceptionId,
        request: { url },
      },
    };

    this.connections.forEach((ws) => {
      ws.send(JSON.stringify(message));
    });
  }
}

/**
 * Create mock HTTP targets response
 */
export function createMockTargets(port: number): CDPTarget[] {
  return [
    {
      description: '',
      devtoolsFrontendUrl: `http://localhost:${port}/devtools/inspector.html`,
      id: 'page-1',
      title: 'Test Page',
      type: 'page',
      url: 'https://example.com',
      webSocketDebuggerUrl: `ws://localhost:${port}/devtools/page/page-1`,
    },
    {
      description: '',
      devtoolsFrontendUrl: '',
      id: 'background-1',
      title: 'Background Page',
      type: 'background_page',
      url: 'chrome-extension://test',
      webSocketDebuggerUrl: `ws://localhost:${port}/devtools/page/background-1`,
    },
  ];
}