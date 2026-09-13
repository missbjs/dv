import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { CDPClient } from '../src/cdp.js';
import { applyToElement } from '../src/commands/apply-to-element.js';
import { MockCDPServer } from './mock-cdp-server.js';
import { getTestPort } from './test-profiles.js';

/**
 * `applyToElement` is the shared spine of set-text / set-html / set-attribute.
 *
 * Before it existed those commands interpolated the raw selector straight into
 * `document.querySelector('...')`, wrapped the mutation in `if (el) { ... }`, and never
 * looked at the result — so a `>>>` selector threw a SyntaxError in the page, an
 * apostrophe in the selector or the value broke out of the string literal, and every one
 * of those failures still printed `✓ updated`.
 */
describe('applyToElement', () => {
  let client: CDPClient;
  let mockServer: MockCDPServer;
  const testPort = getTestPort('test-dv5');

  beforeAll(async () => {
    mockServer = new MockCDPServer(testPort);
    await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  beforeEach(async () => {
    mockServer.reset();
    client = new CDPClient(testPort);
    await client.connect('page-1');
  });

  afterEach(async () => {
    await client.close();
  });

  it('should wrap the body in a guard that reports whether the element was found', async () => {
    await applyToElement(client, '#target', 'el.textContent = "hi";');
    expect(mockServer.getCallParams('Runtime.evaluate').expression).toBe(
      '(() => { const el = document.querySelector(\'#target\'); if (!el) return false; el.textContent = "hi"; return true; })()'
    );
  });

  it('should pierce shadow roots for a >>> selector', async () => {
    // The raw selector used to go straight into document.querySelector, where `>>>` is
    // not valid CSS: "SyntaxError: ... is not a valid selector", reported as success.
    await applyToElement(client, 'my-comp >>> .btn', 'el.textContent = "hi";');
    const expr = mockServer.getCallParams('Runtime.evaluate').expression;
    expect(expr).toContain(
      "document.querySelector('my-comp')?.shadowRoot?.querySelector('.btn')"
    );
    expect(expr).not.toContain('>>>');
  });

  it('should guard every shadowRoot hop in a nested chain', async () => {
    await applyToElement(client, 'outer >>> middle >>> .inner', 'el.textContent = "hi";');
    const expr = mockServer.getCallParams('Runtime.evaluate').expression;
    expect(expr).not.toContain('?.shadowRoot.querySelector');
    expect(expr).toContain(
      "document.querySelector('outer')?.shadowRoot?.querySelector('middle')?.shadowRoot?.querySelector('.inner')"
    );
  });

  it('should escape an apostrophe in the selector', async () => {
    await applyToElement(client, "[title='it\\'s']", 'el.textContent = "hi";');
    const expr = mockServer.getCallParams('Runtime.evaluate').expression;
    expect(expr).toContain("\\'");
  });

  it('should keep an apostrophe in the value from breaking out of the expression', async () => {
    // set-* embed values with JSON.stringify; this is the shape they produce.
    await applyToElement(client, '#target', `el.textContent = ${JSON.stringify("it's")};`);
    expect(mockServer.getCallParams('Runtime.evaluate').expression).toContain(
      'el.textContent = "it\'s";'
    );
  });

  it('should throw Element not found instead of reporting a false success', async () => {
    await expect(
      applyToElement(client, '#nonexistent', 'el.textContent = "hi";')
    ).rejects.toThrow('Element not found: #nonexistent');
  });

  it('should surface a page exception rather than swallowing it', async () => {
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
    await expect(applyToElement(client, 'x-closed >>> .btn', 'el.remove();')).rejects.toThrow(
      "Cannot read properties of null (reading 'querySelector')"
    );
  });

  it('should reject a >>> selector with an empty segment', async () => {
    await expect(applyToElement(client, 'my-comp >>>', 'el.remove();')).rejects.toThrow(
      'Invalid selector'
    );
  });
});
