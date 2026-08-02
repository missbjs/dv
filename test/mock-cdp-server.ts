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
        if (req.url === '/json' || req.url === '/json/version') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(createMockTargets(this.port)));
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      // Attach WebSocket server to the same HTTP server
      this.wsServer = new WebSocketServer({ server: this.server });

      this.wsServer.on('connection', (ws) => {
        this.connections.push(ws);

        ws.on('message', (data: Buffer) => {
          try {
            const message: CDPMessage = JSON.parse(data.toString());
            const response = this.handleMessage(message);
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

  private handleMessage(message: CDPMessage): CDPMessage {
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
      const result = handler(message.params);
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
        message: { type, text },
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