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

    it('names the tab it could not find, instead of claiming there is no tab', async () => {
      // The generic "No tab found" message read as "Chrome has no tabs open",
      // which sends the reader looking in the wrong place entirely.
      await expect(client.connect('nonexistent-page')).rejects.toThrow(
        /No tab with ID nonexistent-page/
      );
    });

    it('points at the command that lists tab IDs', async () => {
      await expect(client.connect('nonexistent-page')).rejects.toThrow(/ tabs$/);
    });

    it('never falls back to the default tab when a tab ID is given', async () => {
      // A silent fallback would run the command against a tab the caller did
      // not name — the failure mode this error exists to prevent.
      await expect(client.connect('nonexistent-page')).rejects.toThrow();
      // Nothing was connected, so nothing could have been run against a tab.
      await expect(client.send('Runtime.enable')).rejects.toThrow('Not connected');
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

    it('navigateAndWait sends the URL and resolves on the load event', async () => {
      await client.navigateAndWait('https://example.com/mobile', 0);
      expect(mockServer.getCallParams('Page.navigate')).toEqual({ url: 'https://example.com/mobile' });
    });

    it('navigateAndWait enables Page before navigating', async () => {
      await client.navigateAndWait('https://example.com/mobile', 0);
      const order = mockServer.getCalls().map((c) => c.method);
      expect(order.indexOf('Page.enable')).toBeLessThan(order.indexOf('Page.navigate'));
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

    it('should set geolocation with a default accuracy of 100', async () => {
      await client.setGeolocationOverride(37.7749, -122.4194);
      expect(mockServer.getCallParams('Emulation.setGeolocationOverride')).toEqual({
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 100,
      });
    });

    it('should honor an explicit geolocation accuracy', async () => {
      await client.setGeolocationOverride(1, 2, 25);
      expect(mockServer.getCallParams('Emulation.setGeolocationOverride').accuracy).toBe(25);
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

    it('should send a real resize as a device metrics override', async () => {
      await client.resize(1280, 720);
      expect(mockServer.getCallParams('Emulation.setDeviceMetricsOverride')).toEqual({
        width: 1280,
        height: 720,
        deviceScaleFactor: 1,
        mobile: false,
      });
      expect(mockServer.getCalls('Emulation.clearDeviceMetricsOverride')).toHaveLength(0);
    });

    it('should clear the override for resize(0, 0) instead of sizing the tab', async () => {
      await client.resize(0, 0);
      expect(mockServer.getCalls('Emulation.clearDeviceMetricsOverride')).toHaveLength(1);
      // The only override sent is the 0x0 ownership claim — never a real size.
      expect(mockServer.getCalls('Emulation.setDeviceMetricsOverride')).toHaveLength(1);
      expect(mockServer.getCallParams('Emulation.setDeviceMetricsOverride')).toEqual({
        width: 0,
        height: 0,
        deviceScaleFactor: 0,
        mobile: false,
      });
    });

    it('should clear the override when only one dimension is 0', async () => {
      await client.resize(900, 0);
      expect(mockServer.getCalls('Emulation.clearDeviceMetricsOverride')).toHaveLength(1);
      expect(mockServer.getCallParams('Emulation.setDeviceMetricsOverride')).toEqual({
        width: 0,
        height: 0,
        deviceScaleFactor: 0,
        mobile: false,
      });
    });

    it('should claim ownership before clearing device metrics', async () => {
      // A bare clear only reverts an override the same CDP session installed, so
      // the claim has to come first or a stale override survives the clear.
      await expect(client.clearDeviceMetricsOverride()).resolves.toBeUndefined();
      const order = mockServer
        .getCalls()
        .map((c) => c.method)
        .filter((m) => m.startsWith('Emulation.') && m.endsWith('DeviceMetricsOverride'));
      expect(order).toEqual([
        'Emulation.setDeviceMetricsOverride',
        'Emulation.clearDeviceMetricsOverride',
      ]);
      expect(mockServer.getCallParams('Emulation.clearDeviceMetricsOverride')).toBeUndefined();
    });

    it('should clear the user agent override with an empty string', async () => {
      await client.clearUserAgentOverride();
      expect(mockServer.getCallParams('Emulation.setUserAgentOverride')).toEqual({ userAgent: '' });
    });

    it('should clear the timezone override with an empty timezoneId', async () => {
      await client.clearTimezoneOverride();
      expect(mockServer.getCallParams('Emulation.setTimezoneOverride')).toEqual({ timezoneId: '' });
    });

    it('should clear network conditions back to unthrottled', async () => {
      await client.clearNetworkConditions();
      expect(mockServer.getCallParams('Network.emulateNetworkConditions')).toEqual({
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
      });
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
      expect(mockServer.getCallParams('DOM.pushNodesByBackendIdsToFrontend').backendNodeIds).toEqual([10]);
    });

    it('should get attributes for a node', async () => {
      const result = await client.getAttributes(4);
      expect(Array.isArray(result.attributes)).toBe(true);
      expect(result.attributes).toContain('data-dv-ref');
      expect(mockServer.getCallParams('DOM.getAttributes').nodeId).toBe(4);
    });

    it('should resolve the backend id then query the mapped node id', async () => {
      const result = await client.getBoxModelByBackendNode(10);
      expect(result.model).toHaveProperty('content');
      // backend 10 -> nodeId 110; box model must be requested for the mapped id
      expect(mockServer.getCallParams('DOM.getBoxModel').nodeId).toBe(110);
    });

    it('should get outer HTML for the mapped node id', async () => {
      const result = await client.getOuterHTMLByBackendNode(10);
      expect(result).toHaveProperty('outerHTML');
      expect(mockServer.getCallParams('DOM.getOuterHTML').nodeId).toBe(110);
    });

    it('should get node text via resolveNode + callFunctionOn on the mapped id', async () => {
      const text = await client.getNodeTextByBackendNode(10);
      expect(text).toBe('Test Content');
      expect(mockServer.getCallParams('DOM.resolveNode').nodeId).toBe(110);
      expect(mockServer.getCallParams('Runtime.callFunctionOn').objectId).toBe('mock-object-1');
    });

    it('should inspect the mapped node (attributes + box)', async () => {
      const result = await client.inspectBackendNode(10);
      expect(result.nodeId).toBe(110);
      expect(Array.isArray(result.attributes)).toBe(true);
      expect(result.box).toHaveProperty('content');
      expect(mockServer.getCallParams('DOM.getAttributes').nodeId).toBe(110);
      expect(mockServer.getCallParams('DOM.getBoxModel').nodeId).toBe(110);
    });

    it('should click the mapped node at its box-model center', async () => {
      await client.clickBackendNode(10);
      expect(mockServer.getCallParams('DOM.scrollIntoViewIfNeeded').nodeId).toBe(110);
      const mouse = mockServer.getCalls('Input.dispatchMouseEvent');
      expect(mouse.map((c) => c.params.type)).toEqual(['mousePressed', 'mouseReleased']);
      // content [0,0,100,0,100,100,0,100] -> center (50,50)
      expect(mouse[0].params).toMatchObject({ x: 50, y: 50, button: 'left' });
      expect(mouse[1].params).toMatchObject({ x: 50, y: 50, button: 'left' });
    });

    it('should fill by selecting all (Ctrl+A) then typing each character', async () => {
      await client.fillBackendNode(10, 'ab');
      const keys = mockServer.getCalls('Input.dispatchKeyEvent').map((c) => c.params);
      // First two events are the Ctrl+A select-all (modifiers=2)
      expect(keys[0]).toMatchObject({ type: 'keyDown', key: 'a', modifiers: 2 });
      expect(keys[1]).toMatchObject({ type: 'keyUp', key: 'a', modifiers: 2 });
      // Then keyDown/keyUp per character with text
      const typed = keys.slice(2).filter((k) => k.type === 'keyDown').map((k) => k.text);
      expect(typed).toEqual(['a', 'b']);
    });

    it('should type each character without a select-all', async () => {
      await client.typeBackendNode(10, 'hi');
      const keys = mockServer.getCalls('Input.dispatchKeyEvent').map((c) => c.params);
      // No Ctrl+A: no key event should carry modifiers
      expect(keys.every((k) => !k.modifiers)).toBe(true);
      const typed = keys.filter((k) => k.type === 'keyDown').map((k) => k.text);
      expect(typed).toEqual(['h', 'i']);
    });

    it('should resolve a node', async () => {
      const result = await client.resolveNode(4);
      expect(result.object).toHaveProperty('objectId');
      expect(mockServer.getCallParams('DOM.resolveNode').nodeId).toBe(4);
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
      expect(mockServer.getCallParams('DOM.getBoxModel').nodeId).toBe(4);
    });

    it('should throw for missing element box model', async () => {
      await expect(client.getBoxModelBySelector('#nonexistent')).rejects.toThrow('Element not found');
    });

    it('should capture screenshot with the given clip and default scale', async () => {
      const result = await client.captureScreenshotWithClip({ x: 5, y: 10, width: 100, height: 200 });
      expect(result).toHaveProperty('data');
      const params = mockServer.getCallParams('Page.captureScreenshot');
      expect(params).toMatchObject({
        format: 'png',
        captureBeyondViewport: true,
        clip: { x: 5, y: 10, width: 100, height: 200, scale: 1 },
      });
    });

    it('should honor an explicit clip scale', async () => {
      await client.captureScreenshotWithClip({ x: 0, y: 0, width: 50, height: 50, scale: 2 });
      expect(mockServer.getCallParams('Page.captureScreenshot').clip.scale).toBe(2);
    });
  });

  describe('Hover & focus', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should hover the mapped node with a buttonless mouse move at center', async () => {
      await client.hoverBackendNode(10);
      expect(mockServer.getCallParams('DOM.scrollIntoViewIfNeeded').nodeId).toBe(110);
      const move = mockServer.getCallParams('Input.dispatchMouseEvent');
      expect(move).toMatchObject({ type: 'mouseMoved', x: 50, y: 50, button: 'none' });
    });

    it('should hover by selector at the element center', async () => {
      await client.hoverBySelector('#test-element');
      expect(mockServer.getCallParams('DOM.scrollIntoViewIfNeeded').nodeId).toBe(4);
      expect(mockServer.getCallParams('Input.dispatchMouseEvent')).toMatchObject({
        type: 'mouseMoved',
        x: 50,
        y: 50,
        button: 'none',
      });
    });

    it('should throw hovering a missing element', async () => {
      await expect(client.hoverBySelector('#nonexistent')).rejects.toThrow('Element not found');
    });

    it('should focus the mapped node via callFunctionOn(this.focus())', async () => {
      await client.focusBackendNode(10);
      expect(mockServer.getCallParams('DOM.resolveNode').nodeId).toBe(110);
      const call = mockServer.getCallParams('Runtime.callFunctionOn');
      expect(call.objectId).toBe('mock-object-1');
      expect(call.functionDeclaration).toContain('focus');
    });

    it('should focus by selector via callFunctionOn(this.focus())', async () => {
      await client.focusBySelector('#test-element');
      expect(mockServer.getCallParams('DOM.resolveNode').nodeId).toBe(4);
      expect(mockServer.getCallParams('Runtime.callFunctionOn').functionDeclaration).toContain('focus');
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
      await client.scrollIntoView('#test-element');
      expect(mockServer.getCallParams('DOM.scrollIntoViewIfNeeded').nodeId).toBe(4);
    });

    it('should throw scrolling a missing element into view', async () => {
      await expect(client.scrollIntoView('#nonexistent')).rejects.toThrow('Element not found');
    });

    it('should scroll the window by offset', async () => {
      await client.scrollBy(null, 0, 100);
      expect(mockServer.getCallParams('Runtime.evaluate').expression).toBe('window.scrollBy(0, 100)');
    });

    it('should scroll a specific element by offset', async () => {
      await client.scrollBy('#test-element', 0, 50);
      const expr = mockServer.getCallParams('Runtime.evaluate').expression;
      expect(expr).toContain('#test-element');
      expect(expr).toContain('.scrollBy(0, 50)');
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

    it('should navigate to a history entry by id', async () => {
      await client.navigateToHistoryEntry(7);
      expect(mockServer.getCallParams('Page.navigateToHistoryEntry').entryId).toBe(7);
    });

    it('should enable page then reload, resolving on the load event', async () => {
      await client.reloadAndWait(0);
      expect(mockServer.getCalls('Page.reload')).toHaveLength(1);
      expect(mockServer.getCalls('Page.enable').length).toBeGreaterThan(0);
    });
  });

  describe('Element highlight', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should highlight an element with the default overlay color', async () => {
      await client.highlightNode('#test-element');
      const params = mockServer.getCallParams('Overlay.highlightNode');
      expect(params.nodeId).toBe(4);
      expect(params.highlightConfig.contentColor).toEqual({ r: 77, g: 144, b: 254, a: 0.6 });
      expect(params.highlightConfig.showInfo).toBe(true);
    });

    it('should honor a custom highlight color', async () => {
      await client.highlightNode('#test-element', { r: 1, g: 2, b: 3, a: 0.5 });
      expect(mockServer.getCallParams('Overlay.highlightNode').highlightConfig.contentColor).toEqual({
        r: 1,
        g: 2,
        b: 3,
        a: 0.5,
      });
    });

    it('should throw highlighting a missing element', async () => {
      await expect(client.highlightNode('#nonexistent')).rejects.toThrow('Element not found');
    });

    it('should hide the highlight', async () => {
      await client.hideHighlight();
      expect(mockServer.getCalls('Overlay.hideHighlight')).toHaveLength(1);
    });
  });

  describe('File upload', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should set files on the mapped backend node', async () => {
      await client.setFileInputFiles(10, ['/tmp/a.png', '/tmp/b.png']);
      expect(mockServer.getCallParams('DOM.setFileInputFiles')).toEqual({
        nodeId: 110,
        files: ['/tmp/a.png', '/tmp/b.png'],
      });
    });

    it('should set files on the node matched by selector', async () => {
      await client.setFileInputFilesBySelector('#test-element', ['/tmp/a.png']);
      expect(mockServer.getCallParams('DOM.setFileInputFiles')).toEqual({
        nodeId: 4,
        files: ['/tmp/a.png'],
      });
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

    it('should press at source, move in 8 steps, then release at the coordinate', async () => {
      await client.dragAndDrop('#source', { x: 200, y: 200 });
      const mouse = mockServer.getCalls('Input.dispatchMouseEvent').map((c) => c.params);
      const moves = mouse.filter((m) => m.type === 'mouseMoved');

      // press -> 8 moves -> release
      expect(mouse[0]).toMatchObject({ type: 'mousePressed', x: 50, y: 50, button: 'left' });
      expect(moves).toHaveLength(8);
      expect(moves.every((m) => m.buttons === 1)).toBe(true);
      // final interpolation step lands exactly on the target
      expect(moves[7]).toMatchObject({ x: 200, y: 200 });
      expect(mouse[mouse.length - 1]).toMatchObject({ type: 'mouseReleased', x: 200, y: 200 });
    });

    it('should drag from one selector to another', async () => {
      await client.dragAndDrop('#source', '#target');
      const moves = mockServer
        .getCalls('Input.dispatchMouseEvent')
        .filter((c) => c.params.type === 'mouseMoved');
      expect(moves).toHaveLength(8);
    });

    it('should throw when source element is missing', async () => {
      await expect(client.dragAndDrop('#nonexistent', '#target')).rejects.toThrow('Element not found');
    });

    it('should throw when target selector is missing', async () => {
      await expect(client.dragAndDrop('#source', '#nonexistent')).rejects.toThrow('Element not found');
    });
  });

  describe('Shadow-pierce (>>>) selector resolution', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should resolve a >>> selector via Runtime.evaluate + DOM.requestNode', async () => {
      const nodeId = await client.resolveNodeId('my-comp >>> .btn');
      expect(nodeId).toBe(4);
      const evalCall = mockServer.getCallParams('Runtime.evaluate');
      expect(evalCall.expression).toContain('.shadowRoot');
      expect(evalCall.expression).toContain("querySelector('my-comp')");
      expect(evalCall.expression).toContain("querySelector('.btn')");
      // requestNode bridges the retained object to a frontend nodeId
      expect(mockServer.getCallParams('DOM.requestNode').objectId).toBe('mock-shadow-object-1');
      // the retained object is released afterwards
      expect(mockServer.getCalls('Runtime.releaseObject')).toHaveLength(1);
    });

    it('should prime the DOM agent with DOM.getDocument before DOM.requestNode', async () => {
      // Regression: without priming, DOM.requestNode answers `nodeId: 0` rather than
      // failing, and every interaction command reported a bogus "Element not found".
      await client.resolveNodeId('my-comp >>> .btn');
      const methods = mockServer.getCalls().map((c) => c.method);
      const primed = methods.indexOf('DOM.getDocument');
      const requested = methods.indexOf('DOM.requestNode');
      expect(primed).toBeGreaterThanOrEqual(0);
      expect(primed).toBeLessThan(requested);
      // depth 0 — the agent needs a tree, not a serialised one
      expect(mockServer.getCallParams('DOM.getDocument')).toEqual({ depth: 0 });
    });

    it('should resolve a nested >>> chain through multiple shadow roots', async () => {
      const nodeId = await client.resolveNodeId('outer >>> middle >>> .inner');
      expect(nodeId).toBe(4);
      const expr = mockServer.getCallParams('Runtime.evaluate').expression;
      expect(expr).toBe(
        "document.querySelector('outer')?.shadowRoot?.querySelector('middle')?.shadowRoot?.querySelector('.inner')"
      );
    });

    it('should get the box model of an element inside shadow DOM via >>>', async () => {
      const model = await client.getBoxModelBySelector('my-comp >>> .btn');
      expect(model).toHaveProperty('content');
      expect(mockServer.getCallParams('DOM.getBoxModel').nodeId).toBe(4);
    });

    it('should throw, not return null, when a >>> box model target is missing', async () => {
      // Returning null here surfaced as "Cannot read properties of null (reading
      // 'content')" in get-box/screenshot; both paths now throw the same error.
      await expect(client.getBoxModelBySelector('my-comp >>> #nonexistent')).rejects.toThrow(
        'Element not found'
      );
    });

    it('should resolve a plain CSS selector via DOM.querySelector (no shadow eval)', async () => {
      const nodeId = await client.resolveNodeId('#test-element');
      expect(nodeId).toBe(4);
      expect(mockServer.getCalls('DOM.requestNode')).toHaveLength(0);
    });

    it('should throw when a >>> selector matches nothing', async () => {
      await expect(client.resolveNodeId('my-comp >>> #nonexistent')).rejects.toThrow(
        'Element not found'
      );
    });

    it('should click an element inside shadow DOM via >>>', async () => {
      await client.click('my-comp >>> .btn');
      expect(mockServer.getCallParams('DOM.getBoxModel').nodeId).toBe(4);
      const mouse = mockServer.getCalls('Input.dispatchMouseEvent').map((c) => c.params);
      expect(mouse[0]).toMatchObject({ type: 'mousePressed', button: 'left', x: 50, y: 50 });
      expect(mouse[mouse.length - 1]).toMatchObject({ type: 'mouseReleased', button: 'left' });
    });

    it('should hover an element inside shadow DOM via >>>', async () => {
      await client.hoverBySelector('my-comp >>> .btn');
      expect(mockServer.getCallParams('DOM.scrollIntoViewIfNeeded').nodeId).toBe(4);
      expect(mockServer.getCallParams('Input.dispatchMouseEvent')).toMatchObject({
        type: 'mouseMoved',
        button: 'none',
      });
    });

    it('should focus an element inside shadow DOM via >>>', async () => {
      await client.focusBySelector('my-comp >>> input');
      expect(mockServer.getCallParams('DOM.resolveNode').nodeId).toBe(4);
      expect(mockServer.getCallParams('Runtime.callFunctionOn').functionDeclaration).toContain(
        'focus'
      );
    });

    it('should highlight an element inside shadow DOM via >>>', async () => {
      await client.highlightNode('my-comp >>> .btn');
      expect(mockServer.getCallParams('Overlay.highlightNode').nodeId).toBe(4);
    });

    it('should upload files to an input inside shadow DOM via >>>', async () => {
      await client.setFileInputFilesBySelector('my-comp >>> input[type=file]', ['/tmp/a.png']);
      expect(mockServer.getCallParams('DOM.setFileInputFiles')).toEqual({
        nodeId: 4,
        files: ['/tmp/a.png'],
      });
    });

    it('should scroll an element inside shadow DOM into view via >>>', async () => {
      await client.scrollIntoView('my-comp >>> .btn');
      expect(mockServer.getCallParams('DOM.scrollIntoViewIfNeeded').nodeId).toBe(4);
    });

    it('should drag between elements inside shadow DOM via >>>', async () => {
      await client.dragAndDrop('my-comp >>> .src', 'my-comp >>> .dst');
      const moves = mockServer
        .getCalls('Input.dispatchMouseEvent')
        .filter((c) => c.params.type === 'mouseMoved');
      expect(moves).toHaveLength(8);
    });
  });

  describe('Shadow-pierce list resolution (resolveNodeIds)', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should use DOM.querySelectorAll for a plain selector', async () => {
      const nodeIds = await client.resolveNodeIds('.item');
      expect(nodeIds).toEqual([4, 5, 6]);
      expect(mockServer.getCalls('Runtime.evaluate')).toHaveLength(0);
    });

    it('should resolve a >>> selector through Runtime.evaluate instead of DOM.querySelectorAll', async () => {
      // DOM.querySelectorAll cannot see into a shadow root — handed a >>> selector it
      // rejects the whole command with a bare "DOM Error while querying", which is how
      // query-all came to be simply broken on shadow DOM.
      const nodeIds = await client.resolveNodeIds('my-list >>> .item');
      expect(nodeIds).toEqual([4, 4]);
      expect(mockServer.getCalls('DOM.querySelectorAll')).toHaveLength(0);
      expect(mockServer.getCallParams('Runtime.evaluate').expression).toBe(
        "Array.from((document.querySelector('my-list')?.shadowRoot?.querySelectorAll('.item') ?? []))"
      );
    });

    it('should prime the DOM agent before converting element handles to nodeIds', async () => {
      // Same trap as resolveNodeId: unprimed, DOM.requestNode answers nodeId 0 rather
      // than failing, and every match silently disappears from the result.
      await client.resolveNodeIds('my-list >>> .item');
      const methods = mockServer.getCalls().map((c) => c.method);
      const primed = methods.indexOf('DOM.getDocument');
      expect(primed).toBeGreaterThanOrEqual(0);
      expect(primed).toBeLessThan(methods.indexOf('DOM.requestNode'));
    });

    it('should release the array and every element handle it retained', async () => {
      await client.resolveNodeIds('my-list >>> .item');
      const released = mockServer.getCalls('Runtime.releaseObject').map((c) => c.params.objectId);
      expect(released).toHaveLength(3); // the array itself plus one per element
      expect(released).toContain('mock-shadow-object-2');
    });

    it('should return an empty list, not throw, when the shadow query matches nothing', async () => {
      // `?? []` means the expression still evaluates to an array; zero matches is an
      // answer, not a failure.
      mockServer.setHandler('Runtime.getProperties', () => ({
        result: [{ name: 'length', value: { type: 'number', value: 0 } }],
      }));
      await expect(client.resolveNodeIds('my-list >>> .item')).resolves.toEqual([]);
      expect(mockServer.getCalls('DOM.requestNode')).toHaveLength(0);
    });

    it('should surface a page exception as Element not found', async () => {
      mockServer.setHandler('Runtime.evaluate', () => ({
        result: { type: 'undefined' },
        exceptionDetails: {
          text: 'Uncaught',
          exception: { description: 'TypeError: Cannot read properties of null' },
        },
      }));
      await expect(client.resolveNodeIds('my-list >>> .item')).rejects.toThrow('Element not found');
    });

    it('should reject a >>> selector with an empty segment', async () => {
      await expect(client.resolveNodeIds('my-list >>>')).rejects.toThrow('Invalid selector');
    });
  });

  describe('Honest failure on a missing element', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should throw from check() rather than silently doing nothing', async () => {
      // These helpers wrapped their mutation in `if (el) { ... }` and never looked at the
      // result, so a missed selector produced a confident success.
      await expect(client.check('#nonexistent')).rejects.toThrow('Element not found');
    });

    it('should throw from uncheck() rather than silently doing nothing', async () => {
      await expect(client.uncheck('#nonexistent')).rejects.toThrow('Element not found');
    });

    it('should throw from scrollBy() rather than silently doing nothing', async () => {
      await expect(client.scrollBy('#nonexistent', 0, 50)).rejects.toThrow('Element not found');
    });

    it('should throw from scrollIntoView() with options rather than silently doing nothing', async () => {
      await expect(
        client.scrollIntoView('#nonexistent', { block: 'center' })
      ).rejects.toThrow('Element not found');
    });

    it('should still succeed when the element is there', async () => {
      await expect(client.check('#test-element')).resolves.toBeUndefined();
      await expect(client.uncheck('#test-element')).resolves.toBeUndefined();
      await expect(client.scrollBy('#test-element', 0, 50)).resolves.toBeUndefined();
    });

    it('should surface a page exception from isVisible instead of reporting false', async () => {
      // Runtime.evaluate puts a thrown expression in exceptionDetails and leaves
      // result.value undefined, so `result.result?.value ?? false` reported a confident
      // "not visible" for an expression that never ran — which is exactly how a TypeError
      // inside a >>> chain disguised itself as a missing element.
      mockServer.setHandler('Runtime.evaluate', () => ({
        result: { type: 'undefined' },
        exceptionDetails: {
          text: 'Uncaught',
          exception: {
            description:
              "TypeError: Cannot read properties of null (reading 'querySelector')\n    at <anonymous>:1:42",
          },
        },
      }));
      await expect(client.isVisible('x-closed >>> .btn')).rejects.toThrow(
        "Cannot read properties of null (reading 'querySelector')"
      );
      // only the first line — the stack belongs in the page, not in the CLI output
      await expect(client.isVisible('x-closed >>> .btn')).rejects.toThrow(/^[^\n]+$/);
    });

    it('should surface a page exception from getElementValue instead of reporting null', async () => {
      mockServer.setHandler('Runtime.evaluate', () => ({
        result: { type: 'undefined' },
        exceptionDetails: { text: 'Uncaught SyntaxError: bad selector' },
      }));
      await expect(client.getElementValue('x-closed >>> .btn')).rejects.toThrow('bad selector');
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

    it('should get storage items for the local-storage storageId', async () => {
      const result = await client.getStorageItems('https://example.com', true);
      expect(Array.isArray(result.entries)).toBe(true);
      expect(mockServer.getCallParams('DOMStorage.getDOMStorageItems').storageId).toEqual({
        origin: 'https://example.com',
        isLocalStorage: true,
      });
    });

    it('should distinguish session storage via isLocalStorage=false', async () => {
      await client.getStorageItems('https://example.com', false);
      expect(mockServer.getCallParams('DOMStorage.getDOMStorageItems').storageId.isLocalStorage).toBe(false);
    });

    it('should set a storage item with the storageId, key and value', async () => {
      await client.setStorageItem('https://example.com', true, 'k', 'v');
      expect(mockServer.getCallParams('DOMStorage.setDOMStorageItem')).toEqual({
        storageId: { origin: 'https://example.com', isLocalStorage: true },
        key: 'k',
        value: 'v',
      });
    });

    it('should remove a storage item by storageId and key', async () => {
      await client.removeStorageItem('https://example.com', true, 'k');
      expect(mockServer.getCallParams('DOMStorage.removeDOMStorageItem')).toEqual({
        storageId: { origin: 'https://example.com', isLocalStorage: true },
        key: 'k',
      });
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
      await client.setNodeValue(4, 'new value');
      expect(mockServer.getCallParams('DOM.setNodeValue')).toEqual({ nodeId: 4, value: 'new value' });
    });
  });

  describe('Mutation observer', () => {
    beforeEach(async () => {
      await client.connect('page-1');
    });

    afterEach(async () => {
      await client.close();
    });

    it('should install a mutation observer via evaluate', async () => {
      await client.installMutationObserver();
      const expr = mockServer.getCallParams('Runtime.evaluate').expression;
      expect(expr).toContain('MutationObserver');
      expect(expr).toContain('__dvMutations');
      expect(expr).toContain('.observe(');
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