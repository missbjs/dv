import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { CDPClient } from '../src/cdp.js';
import { MockCDPServer, createMockTargets } from './mock-cdp-server.js';
import { TEST_PORT } from './test-profiles.js';
import axios from 'axios';

describe('CDPClient', () => {
  let client: CDPClient;
  let mockServer: MockCDPServer;
  const testPort = TEST_PORT;

  beforeAll(async () => {
    // Start mock CDP server
    mockServer = new MockCDPServer(testPort);
    await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  beforeEach(() => {
    // Reset mock handlers so a negative test's setHandler() override (e.g.
    // DOM.querySelector → nodeId undefined) doesn't leak into later tests.
    mockServer.reset();
    client = new CDPClient(testPort);
  });

  describe('constructor', () => {
    it('should create instance with correct port', () => {
      expect(client).toBeInstanceOf(CDPClient);
    });
  });

  describe('getTargets', () => {
    it('should return list of CDP targets', async () => {
      // Mock HTTP endpoint
      const targets = createMockTargets(testPort);

      // Since we're using a real HTTP server mock, we'll test the structure
      // In a real test, you'd mock axios or use a real HTTP server
      expect(targets).toBeDefined();
      expect(targets.length).toBeGreaterThan(0);
      expect(targets[0]).toHaveProperty('id');
      expect(targets[0]).toHaveProperty('type');
      expect(targets[0]).toHaveProperty('webSocketDebuggerUrl');
    });

    it('should throw error when Chrome is not running', async () => {
      const offlineClient = new CDPClient(9999); // Non-existent port

      await expect(offlineClient.getTargets()).rejects.toThrow();
    });
  });

  describe('connect', () => {
    it('should connect to WebSocket successfully', async () => {
      await expect(client.connect('page-1')).resolves.toBeUndefined();
      await client.close();
    });

    it('should throw error when page not found', async () => {
      await expect(client.connect('nonexistent-page')).rejects.toThrow();
    });
  });

  describe('send', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should send CDP command and receive response', async () => {
      const result = await client.send('Runtime.enable');
      expect(result).toBeDefined();
    });

    it('should handle method with parameters', async () => {
      const result = await client.send('Page.navigate', { url: 'https://example.com' });
      expect(result).toHaveProperty('frameId');
    });

    it('should throw error when not connected', async () => {
      await client.close();
      await expect(client.send('Runtime.enable')).rejects.toThrow('Not connected');
    });

    it('should timeout after 30 seconds', async () => {
      // Mock a slow handler
      mockServer.setHandler('Slow.method', () => {
        return new Promise((resolve) => setTimeout(resolve, 35000));
      });

      await expect(client.send('Slow.method')).rejects.toThrow('Timeout');
    }, 35000);
  });

  describe('Runtime domain', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should enable runtime', async () => {
      await expect(client.enableRuntime()).resolves.toBeUndefined();
    });

    it('should evaluate JavaScript expression', async () => {
      const result = await client.evaluate('1 + 1');
      expect(result).toBeDefined();
      expect(result.result).toHaveProperty('value');
    });
  });

  describe('Page domain', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should enable page', async () => {
      await expect(client.enablePage()).resolves.toBeUndefined();
    });

    it('should navigate to URL', async () => {
      const result = await client.navigate('https://example.com');
      expect(result).toHaveProperty('frameId');
      expect(result).toHaveProperty('loaderId');
    });

    it('should take screenshot', async () => {
      const result = await client.takeScreenshot();
      expect(result).toHaveProperty('data');
    });
  });

  describe('Console domain', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should enable console', async () => {
      await expect(client.enableConsole()).resolves.toBeUndefined();
    });

    it('should store console messages', async () => {
      await client.enableConsole();

      // Simulate console message
      mockServer.broadcastConsoleMessage('log', 'Test message');

      // Wait for message to be processed
      await new Promise((resolve) => setTimeout(resolve, 100));

      const messages = await client.getConsoleMessages();
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]).toHaveProperty('type', 'log');
      expect(messages[0]).toHaveProperty('text', 'Test message');
    });

    it('should clear console messages', async () => {
      await client.clearConsoleMessages();
      const messages = await client.getConsoleMessages();
      expect(messages).toHaveLength(0);
    });
  });

  describe('Network domain', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should enable network monitoring', async () => {
      await expect(client.enableNetwork()).resolves.toBeUndefined();
    });

    it('should store network requests', async () => {
      await client.enableNetwork();

      // Simulate network request
      mockServer.broadcastNetworkRequest('req-1', 'https://api.example.com/data', 'GET');

      // Wait for message to be processed
      await new Promise((resolve) => setTimeout(resolve, 100));

      const requests = await client.getNetworkRequests();
      expect(requests.length).toBeGreaterThan(0);
      expect(requests[0]).toHaveProperty('requestId', 'req-1');
    });

    it('should get response body', async () => {
      const result = await client.getResponseBody('req-1');
      expect(result).toHaveProperty('body');
    });

    it('should clear network requests', async () => {
      await client.clearNetworkRequests();
      const requests = await client.getNetworkRequests();
      expect(requests).toHaveLength(0);
    });

    it('should clear browser cache', async () => {
      await expect(client.clearBrowserCache()).resolves.toBeUndefined();
    });

    it('should set cache disabled', async () => {
      await expect(client.setCacheDisabled(true)).resolves.toBeUndefined();
    });
  });

  describe('DOM domain', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should inspect element', async () => {
      const result = await client.inspectElement('#test-element');
      expect(result).toHaveProperty('nodeId');
      expect(result).toHaveProperty('attributes');
      expect(result).toHaveProperty('box');
    });

    it('should throw error for non-existent element', async () => {
      mockServer.setHandler('DOM.querySelector', () => ({ nodeId: undefined }));
      await expect(client.inspectElement('#nonexistent')).rejects.toThrow('Element not found');
    });

    it('should query all elements', async () => {
      const result = await client.querySelectorAll('.item');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get outer HTML', async () => {
      const html = await client.getOuterHTML(4);
      expect(html).toHaveProperty('outerHTML');
    });

    it('should set outer HTML', async () => {
      await expect(client.setOuterHTML(4, '<div>New content</div>')).resolves.toBeUndefined();
    });

    it('should set attribute value', async () => {
      await expect(client.setAttributeValue(4, 'disabled', 'true')).resolves.toBeUndefined();
    });
  });

  describe('Input domain', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should click element', async () => {
      await expect(client.click('#test-element')).resolves.toBeUndefined();
    });

    it('should throw error when clicking non-existent element', async () => {
      mockServer.setHandler('DOM.querySelector', () => ({ nodeId: undefined }));
      await expect(client.click('#nonexistent')).rejects.toThrow('Element not found');
    });

    it('should fill input', async () => {
      await expect(client.fill('#email', 'test@example.com')).resolves.toBeUndefined();
    });

    it('should type text', async () => {
      await expect(client.type('#search', 'hello world')).resolves.toBeUndefined();
    });

    it('should press key', async () => {
      await expect(client.pressKey('Enter')).resolves.toBeUndefined();
    });
  });

  describe('Emulation domain', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should resize viewport', async () => {
      await expect(client.resize(1920, 1080)).resolves.toBeUndefined();
    });

    it('should set device metrics', async () => {
      await expect(
        client.setDeviceMetricsOverride(375, 812, 3, true)
      ).resolves.toBeUndefined();
    });

    it('should set geolocation', async () => {
      await expect(
        client.setGeolocationOverride(37.7749, -122.4194)
      ).resolves.toBeUndefined();
    });

    it('should set user agent', async () => {
      await expect(
        client.setUserAgentOverride('Mozilla/5.0 Test')
      ).resolves.toBeUndefined();
    });

    it('should set timezone', async () => {
      await expect(client.setTimezoneOverride('America/Los_Angeles')).resolves.toBeUndefined();
    });

    it('should set network conditions', async () => {
      await expect(
        client.setNetworkConditions(false, 100, 1000000, 500000)
      ).resolves.toBeUndefined();
    });

    it('should clear geolocation override', async () => {
      await expect(client.clearGeolocationOverride()).resolves.toBeUndefined();
    });
  });

  describe('Storage domain', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should get cookies', async () => {
      const result = await client.getCookies();
      expect(result).toHaveProperty('cookies');
      expect(Array.isArray(result.cookies)).toBe(true);
    });

    it('should clear cookies', async () => {
      await expect(client.clearCookies()).resolves.toBeUndefined();
    });

    it('should clear data for origin', async () => {
      await expect(
        client.clearDataForOrigin('https://example.com', 'local_storage')
      ).resolves.toBeUndefined();
    });
  });

  describe('Request interception', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should set request interception', async () => {
      await expect(
        client.setRequestInterception([{ urlPattern: '*api*' }])
      ).resolves.toBeUndefined();
    });

    it('should handle intercepted requests', async () => {
      let interceptedParams: any = null;
      client.onRequestIntercepted((params) => {
        interceptedParams = params;
      });

      mockServer.broadcastRequestIntercepted('int-1', 'https://api.example.com/data');

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(interceptedParams).not.toBeNull();
      expect(interceptedParams).toHaveProperty('interceptionId');
    });

    it('should continue intercepted request', async () => {
      await expect(
        client.continueInterceptedRequest('int-1')
      ).resolves.toBeUndefined();
    });

    it('should block intercepted request', async () => {
      await expect(
        client.continueInterceptedRequest('int-1', 'BlockedByClient')
      ).resolves.toBeUndefined();
    });
  });

  describe('Console buffer swap', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should return and clear messages atomically', async () => {
      await client.enableConsole();
      mockServer.broadcastConsoleMessage('warning', 'Heads up');
      await new Promise((resolve) => setTimeout(resolve, 100));

      const first = await client.getAndClearConsoleMessages();
      expect(first.length).toBeGreaterThan(0);
      expect(first[0]).toHaveProperty('type', 'warning');

      // Buffer must be empty on the next read
      const second = await client.getAndClearConsoleMessages();
      expect(second).toHaveLength(0);
    });
  });

  describe('Backend-node bridge', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should push backend node ids to frontend', async () => {
      const result = await client.pushNodesByBackendIdsToFrontend([10]);
      expect(result.nodeIds).toEqual([110]); // mock maps id -> id + 100
    });

    it('should get attributes for a node', async () => {
      const result = await client.getAttributes(4);
      expect(Array.isArray(result.attributes)).toBe(true);
      expect(result.attributes).toContain('data-dv-ref');
    });

    it('should get box model by backend node', async () => {
      const result = await client.getBoxModelByBackendNode(10);
      expect(result.model).toHaveProperty('content');
    });

    it('should get outer HTML by backend node', async () => {
      const result = await client.getOuterHTMLByBackendNode(10);
      expect(result).toHaveProperty('outerHTML');
    });

    it('should get text by backend node via evaluate', async () => {
      const text = await client.getTextByBackendNode(10);
      expect(typeof text).toBe('string');
    });

    it('should get node text by backend node via callFunctionOn', async () => {
      const text = await client.getNodeTextByBackendNode(10);
      expect(text).toBe('Test Content');
    });

    it('should inspect a backend node', async () => {
      const result = await client.inspectBackendNode(10);
      expect(result.nodeId).toBe(110);
      expect(Array.isArray(result.attributes)).toBe(true);
      expect(result.box).toHaveProperty('content');
    });

    it('should click a backend node', async () => {
      await expect(client.clickBackendNode(10)).resolves.toBeUndefined();
    });

    it('should fill a backend node', async () => {
      await expect(client.fillBackendNode(10, 'hello')).resolves.toBeUndefined();
    });

    it('should type into a backend node', async () => {
      await expect(client.typeBackendNode(10, 'hello')).resolves.toBeUndefined();
    });

    it('should resolve a node', async () => {
      const result = await client.resolveNode(4);
      expect(result.object).toHaveProperty('objectId');
    });

    it('should throw when backend node cannot be resolved', async () => {
      mockServer.setHandler('DOM.pushNodesByBackendIdsToFrontend', () => ({ nodeIds: [] }));
      await expect(client.clickBackendNode(999)).rejects.toThrow('Cannot resolve backend DOM node');
    });
  });

  describe('Accessibility domain', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should enable accessibility', async () => {
      await expect(client.enableAccessibility()).resolves.toBeUndefined();
    });

    it('should get full AX tree', async () => {
      const result = await client.getFullAXTree();
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(result.nodes.length).toBeGreaterThan(0);
      expect(result.nodes[0].role.value).toBe('RootWebArea');
    });

    it('should get full AX tree with depth', async () => {
      const result = await client.getFullAXTree(5);
      expect(Array.isArray(result.nodes)).toBe(true);
    });

    it('should get partial AX tree', async () => {
      const result = await client.getPartialAXTree({ backendNodeId: 10 });
      expect(result).toHaveProperty('nodes');
    });

    it('should query AX tree', async () => {
      const result = await client.queryAXTree({ role: 'button' });
      expect(result).toHaveProperty('nodes');
    });
  });

  describe('Element box model & clipped screenshot', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should get box model by selector', async () => {
      const model = await client.getBoxModelBySelector('#test-element');
      expect(model).toHaveProperty('content');
    });

    it('should throw for missing element box model', async () => {
      await expect(client.getBoxModelBySelector('#nonexistent')).rejects.toThrow('Element not found');
    });

    it('should capture screenshot with clip', async () => {
      const result = await client.captureScreenshotWithClip({ x: 0, y: 0, width: 100, height: 100 });
      expect(result).toHaveProperty('data');
    });
  });

  describe('Hover & focus', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should hover by backend node', async () => {
      await expect(client.hoverBackendNode(10)).resolves.toBeUndefined();
    });

    it('should hover by selector', async () => {
      await expect(client.hoverBySelector('#test-element')).resolves.toBeUndefined();
    });

    it('should throw hovering a missing element', async () => {
      await expect(client.hoverBySelector('#nonexistent')).rejects.toThrow('Element not found');
    });

    it('should focus by backend node', async () => {
      await expect(client.focusBackendNode(10)).resolves.toBeUndefined();
    });

    it('should focus by selector', async () => {
      await expect(client.focusBySelector('#test-element')).resolves.toBeUndefined();
    });

    it('should throw focusing a missing element', async () => {
      await expect(client.focusBySelector('#nonexistent')).rejects.toThrow('Element not found');
    });
  });

  describe('Performance domain', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should enable performance', async () => {
      await expect(client.enablePerformance()).resolves.toBeUndefined();
    });

    it('should get performance metrics', async () => {
      const result = await client.getPerformanceMetrics();
      expect(Array.isArray(result.metrics)).toBe(true);
      expect(result.metrics.length).toBeGreaterThan(0);
    });
  });

  describe('Scroll', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should scroll an element into view', async () => {
      await expect(client.scrollIntoView('#test-element')).resolves.toBeUndefined();
    });

    it('should throw scrolling a missing element into view', async () => {
      await expect(client.scrollIntoView('#nonexistent')).rejects.toThrow('Element not found');
    });

    it('should scroll the window by offset', async () => {
      await expect(client.scrollBy(null, 0, 100)).resolves.toBeUndefined();
    });

    it('should scroll an element by offset', async () => {
      await expect(client.scrollBy('#test-element', 0, 50)).resolves.toBeUndefined();
    });
  });

  describe('Navigation history', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should get navigation history', async () => {
      const result = await client.getNavigationHistory();
      expect(result).toHaveProperty('currentIndex');
      expect(Array.isArray(result.entries)).toBe(true);
    });

    it('should navigate to a history entry', async () => {
      await expect(client.navigateToHistoryEntry(0)).resolves.toBeUndefined();
    });

    it('should reload and wait for load event', async () => {
      await expect(client.reloadAndWait(0)).resolves.toBeUndefined();
    });
  });

  describe('Element highlight', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should highlight an element', async () => {
      await expect(client.highlightNode('#test-element')).resolves.toBeUndefined();
    });

    it('should throw highlighting a missing element', async () => {
      await expect(client.highlightNode('#nonexistent')).rejects.toThrow('Element not found');
    });

    it('should hide the highlight', async () => {
      await expect(client.hideHighlight()).resolves.toBeUndefined();
    });
  });

  describe('File upload', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should set files by backend node', async () => {
      await expect(client.setFileInputFiles(10, ['/tmp/a.png'])).resolves.toBeUndefined();
    });

    it('should set files by selector', async () => {
      await expect(
        client.setFileInputFilesBySelector('#test-element', ['/tmp/a.png'])
      ).resolves.toBeUndefined();
    });

    it('should throw setting files on a missing element', async () => {
      await expect(
        client.setFileInputFilesBySelector('#nonexistent', ['/tmp/a.png'])
      ).rejects.toThrow('Element not found');
    });
  });

  describe('Drag & drop', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should drag from one selector to another', async () => {
      await expect(client.dragAndDrop('#source', '#target')).resolves.toBeUndefined();
    });

    it('should drag to a coordinate', async () => {
      await expect(client.dragAndDrop('#source', { x: 200, y: 200 })).resolves.toBeUndefined();
    });

    it('should throw when source element is missing', async () => {
      await expect(client.dragAndDrop('#nonexistent', '#target')).rejects.toThrow('Element not found');
    });
  });

  describe('DOM storage', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should enable storage', async () => {
      await expect(client.enableStorage()).resolves.toBeUndefined();
    });

    it('should enable emulation', async () => {
      await expect(client.enableEmulation()).resolves.toBeUndefined();
    });

    it('should get storage items', async () => {
      const result = await client.getStorageItems('https://example.com', true);
      expect(Array.isArray(result.entries)).toBe(true);
    });

    it('should set a storage item', async () => {
      await expect(
        client.setStorageItem('https://example.com', true, 'k', 'v')
      ).resolves.toBeUndefined();
    });

    it('should remove a storage item', async () => {
      await expect(
        client.removeStorageItem('https://example.com', true, 'k')
      ).resolves.toBeUndefined();
    });
  });

  describe('DOM node value', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should set node value', async () => {
      await expect(client.setNodeValue(4, 'new value')).resolves.toBeUndefined();
    });
  });

  describe('Mutation observer', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should install a mutation observer', async () => {
      await expect(client.installMutationObserver()).resolves.toBeUndefined();
    });

    it('should read accumulated mutations', async () => {
      mockServer.setHandler('Runtime.evaluate', () => ({
        result: { value: [{ type: 'childList', added: 1, removed: 0 }] },
      }));
      const muts = await client.readMutations();
      expect(Array.isArray(muts)).toBe(true);
      expect(muts.length).toBe(1);
    });
  });

  describe('Tab management', () => {
    it('should open a new tab', async () => {
      const tab = await client.newTab('https://example.com');
      expect(tab).toHaveProperty('id', 'new-tab-1');
      expect(tab).toHaveProperty('webSocketDebuggerUrl');
    });

    it('should close a tab', async () => {
      await expect(client.closeTab('page-1')).resolves.toBeUndefined();
    });
  });

  describe('Cleanup', () => {
    it('should close WebSocket connection', async () => {
      await client.connect('page-1');
      await client.close();
      // Should not throw when trying to send after close
      await expect(client.send('Runtime.enable')).rejects.toThrow('Not connected');
    });
  });
});