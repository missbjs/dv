import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { buildExpression } from '../src/commands/query.js';
import { CDPClient } from '../src/cdp.js';
import { MockCDPServer, createMockTargets } from './mock-cdp-server.js';
import { getTestPort } from './test-profiles.js';

const TEST_PORT = getTestPort('test-dv2');

// ── buildExpression() unit tests (pure function, no CDP needed) ──

describe('buildExpression', () => {
  describe('non-shadow selectors', () => {
    it('should build default outerHTML expression', () => {
      const expr = buildExpression('.btn', { profile: 'test-dv1', selector: '.btn' });
      expect(expr).toBe("document.querySelector('.btn')?.outerHTML ?? ''");
    });

    it('should build textContent expression', () => {
      const expr = buildExpression('#title', { profile: 'test-dv1', selector: '#title', text: true });
      expect(expr).toBe("document.querySelector('#title')?.textContent ?? ''");
    });

    it('should build getAttribute expression', () => {
      const expr = buildExpression('input', { profile: 'test-dv1', selector: 'input', attr: 'placeholder' });
      expect(expr).toBe("document.querySelector('input')?.getAttribute('placeholder') ?? ''");
    });

    it('should build count expression', () => {
      const expr = buildExpression('.item', { profile: 'test-dv1', selector: '.item', count: true });
      expect(expr).toBe("document.querySelectorAll('.item').length");
    });

    it('should build exists expression', () => {
      const expr = buildExpression('.modal', { profile: 'test-dv1', selector: '.modal', exists: true });
      expect(expr).toBe("document.querySelector('.modal') !== null");
    });

    it('should escape special characters in selector', () => {
      const expr = buildExpression("it's.btn", { profile: 'test-dv1', selector: "it's.btn" });
      expect(expr).toBe("document.querySelector('it\\'s.btn')?.outerHTML ?? ''");
    });
  });

  describe('shadow >>> selectors', () => {
    it('should build single-level shadow expression', () => {
      const expr = buildExpression('my-comp >>> .btn', { profile: 'test-dv1', selector: 'my-comp >>> .btn' });
      expect(expr).toBe("document.querySelector('my-comp')?.shadowRoot.querySelector('.btn')?.outerHTML ?? ''");
    });

    it('should build nested shadow expression', () => {
      const expr = buildExpression('outer >>> middle >>> .inner', { profile: 'test-dv1', selector: 'outer >>> middle >>> .inner', text: true });
      expect(expr).toBe("document.querySelector('outer')?.shadowRoot.querySelector('middle')?.shadowRoot.querySelector('.inner')?.textContent ?? ''");
    });

    it('should build shadow expression with getAttribute', () => {
      const expr = buildExpression('x-input >>> input', { profile: 'test-dv1', selector: 'x-input >>> input', attr: 'placeholder' });
      expect(expr).toBe("document.querySelector('x-input')?.shadowRoot.querySelector('input')?.getAttribute('placeholder') ?? ''");
    });

    it('should build shadow count expression', () => {
      const expr = buildExpression('my-list >>> .item', { profile: 'test-dv1', selector: 'my-list >>> .item', count: true });
      expect(expr).toBe("(document.querySelector('my-list')?.shadowRoot?.querySelectorAll('.item')?.length ?? 0)");
    });

    it('should build shadow exists expression', () => {
      const expr = buildExpression('my-dialog >>> .modal', { profile: 'test-dv1', selector: 'my-dialog >>> .modal', exists: true });
      expect(expr).toBe("!!(document.querySelector('my-dialog')?.shadowRoot.querySelector('.modal')?. ?? '')");
    });

    it('should handle trailing >>> gracefully', () => {
      const expr = buildExpression('my-comp >>>', { profile: 'test-dv1', selector: 'my-comp >>>' });
      expect(expr).toBe("document.querySelector('my-comp')?.shadowRoot.querySelector('')?.outerHTML ?? ''");
    });

    it('should trim whitespace around parts', () => {
      const expr = buildExpression('  my-comp   >>>   .btn  ', { profile: 'test-dv1', selector: '  my-comp   >>>   .btn  ' });
      expect(expr).toBe("document.querySelector('my-comp')?.shadowRoot.querySelector('.btn')?.outerHTML ?? ''");
    });

    it('should escape special characters in shadow parts', () => {
      const expr = buildExpression("my-comp >>> it's.btn", { profile: 'test-dv1', selector: "my-comp >>> it's.btn" });
      expect(expr).toBe("document.querySelector('my-comp')?.shadowRoot.querySelector('it\\'s.btn')?.outerHTML ?? ''");
    });
  });
});

// ── query() integration tests with MockCDPServer ──

describe('query command integration', () => {
  let client: CDPClient;
  let mockServer: MockCDPServer;
  const testPort = TEST_PORT;

  beforeAll(async () => {
    mockServer = new MockCDPServer(testPort);
    await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  beforeEach(() => {
    client = new CDPClient(testPort);
  });

  afterEach(async () => {
    await client.close();
  });

  describe('evaluate expression', () => {
    it('should send the correct expression to Runtime.evaluate', async () => {
      await client.connect('page-1');

      let capturedExpression = '';
      mockServer.setHandler('Runtime.evaluate', (params: any) => {
        capturedExpression = params.expression;
        return { result: { type: 'string', value: '<div>Hello</div>' } };
      });

      const expression = buildExpression('.btn', { profile: 'test-dv1', selector: '.btn' });
      const result = await client.evaluate(expression);

      expect(capturedExpression).toBe("document.querySelector('.btn')?.outerHTML ?? ''");
      expect(result.result.value).toBe('<div>Hello</div>');
    });

    it('should evaluate shadow count expression', async () => {
      await client.connect('page-1');

      mockServer.setHandler('Runtime.evaluate', (params: any) => {
        if (params.expression.includes('querySelectorAll')) {
          return { result: { type: 'number', value: 5 } };
        }
        return { result: { type: 'string', value: 'ok' } };
      });

      const expression = buildExpression('my-list >>> .item', { profile: 'test-dv1', selector: 'my-list >>> .item', count: true });
      const result = await client.evaluate(expression);

      expect(result.result.value).toBe(5);
    });

    it('should evaluate shadow exists expression (true)', async () => {
      await client.connect('page-1');

      mockServer.setHandler('Runtime.evaluate', () => {
        return { result: { type: 'boolean', value: true } };
      });

      const expression = buildExpression('my-dialog >>> .modal', { profile: 'test-dv1', selector: 'my-dialog >>> .modal', exists: true });
      const result = await client.evaluate(expression);

      expect(result.result.value).toBe(true);
    });

    it('should evaluate shadow exists expression (false)', async () => {
      await client.connect('page-1');

      mockServer.setHandler('Runtime.evaluate', () => {
        return { result: { type: 'boolean', value: false } };
      });

      const expression = buildExpression('my-dialog >>> .modal', { profile: 'test-dv1', selector: 'my-dialog >>> .modal', exists: true });
      const result = await client.evaluate(expression);

      expect(result.result.value).toBe(false);
    });

    it('should return empty string for non-existent element', async () => {
      await client.connect('page-1');

      mockServer.setHandler('Runtime.evaluate', () => {
        return { result: { type: 'string', value: '' } };
      });

      const expression = buildExpression('#nonexistent', { profile: 'test-dv1', selector: '#nonexistent' });
      const result = await client.evaluate(expression);

      expect(result.result.value).toBe('');
    });
  });

  describe('error handling', () => {
    it('should return exceptionDetails when Runtime throws', async () => {
      await client.connect('page-1');

      mockServer.setHandler('Runtime.evaluate', () => ({
        exceptionDetails: {
          text: 'TypeError: Cannot read properties of null',
          exception: { description: 'TypeError: Cannot read properties of null (reading querySelector)\n    at eval (eval at <anonymous>)' },
        },
      }));

      const expression = buildExpression('.btn', { profile: 'test-dv1', selector: '.btn' });
      const result = await client.evaluate(expression);

      expect(result.exceptionDetails).toBeDefined();
      expect(result.exceptionDetails.text).toBe('TypeError: Cannot read properties of null');
    });

    it('should handle connection error gracefully', async () => {
      const offlineClient = new CDPClient(9999);
      await expect(offlineClient.connect('page-1')).rejects.toThrow();
    });
  });
});