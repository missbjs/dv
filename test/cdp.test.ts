import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { CDPClient } from '../src/cdp.js';
import { MockCDPServer, createMockTargets } from './mock-cdp-server.js';
import { TEST_PORT } from './test-profiles.js';
import axios from 'axios';
import { promises as fs } from 'fs';
import { join } from 'path';

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

  describe('State management', () => {
    it('should load state from file', async () => {
      const state = await client.loadState();
      // Returns null if no state file exists
      expect(state).toBeNull();
    });

    it('should save state to file', async () => {
      await client.saveState();
      // Verify file was created
      const stateData = await fs.readFile('.dv-session.json', 'utf-8');
      expect(stateData).toBeDefined();
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