import { describe, it, expect } from 'vitest';
import { getPortFromProfile, escapeJsString, buildShadowExpression, buildShadowRectExpression, buildElementExpression } from '../src/utils.js';
import { PROFILES } from '../src/profiles.js';

describe('Utility Functions', () => {
  describe('getPortFromProfile', () => {
    it('should return correct port for valid profile', () => {
      expect(getPortFromProfile('dv1')).toBe(9230);
      expect(getPortFromProfile('dv2')).toBe(9231);
      expect(getPortFromProfile('dv3')).toBe(9232);
      expect(getPortFromProfile('dv4')).toBe(9233);
      expect(getPortFromProfile('dv5')).toBe(9234);
      expect(getPortFromProfile('dv6')).toBe(9235);
    });

    it('should throw error for invalid profile', () => {
      expect(() => getPortFromProfile('invalid-profile')).toThrow();
    });

    it('should throw error for empty string', () => {
      expect(() => getPortFromProfile('')).toThrow();
    });

    it('should throw error for null', () => {
      expect(() => getPortFromProfile(null as any)).toThrow();
    });

    it('should throw error for undefined', () => {
      expect(() => getPortFromProfile(undefined as any)).toThrow();
    });

    it('should be case-sensitive', () => {
      expect(() => getPortFromProfile('DV1')).toThrow();
      expect(() => getPortFromProfile('Dv1')).toThrow();
    });

    it('should reject test profile names', () => {
      expect(() => getPortFromProfile('test-dv1')).toThrow();
    });

    it('should return number type', () => {
      const port = getPortFromProfile('dv1');
      expect(typeof port).toBe('number');
    });

    it('should return port in valid range', () => {
      const port = getPortFromProfile('dv1');
      expect(port).toBeGreaterThanOrEqual(9230);
      expect(port).toBeLessThanOrEqual(9235);
    });
  });

  describe('escapeJsString', () => {
    it('should escape backslashes', () => {
      expect(escapeJsString('a\\b')).toBe('a\\\\b');
    });

    it('should escape single quotes', () => {
      expect(escapeJsString("it's")).toBe("it\\'s");
    });

    it('should escape newlines', () => {
      expect(escapeJsString('line1\nline2')).toBe('line1\\nline2');
    });

    it('should escape carriage returns', () => {
      expect(escapeJsString('line1\rline2')).toBe('line1\\rline2');
    });

    it('should pass through strings with no special characters', () => {
      expect(escapeJsString('hello')).toBe('hello');
      expect(escapeJsString('div.class')).toBe('div.class');
      expect(escapeJsString('#id')).toBe('#id');
    });

    it('should handle empty strings', () => {
      expect(escapeJsString('')).toBe('');
    });

    it('should handle strings with mixed special characters', () => {
      const input = "it's a \\test\nnew\rline";
      const expected = "it\\'s a \\\\test\\nnew\\rline";
      expect(escapeJsString(input)).toBe(expected);
    });
  });

  describe('buildShadowExpression', () => {
    it('should build expression for non-shadow selector with default accessor', () => {
      const expr = buildShadowExpression('.btn', 'outerHTML');
      expect(expr).toBe("document.querySelector('.btn')?.outerHTML ?? ''");
    });

    it('should build expression for non-shadow selector with textContent', () => {
      const expr = buildShadowExpression('#title', 'textContent');
      expect(expr).toBe("document.querySelector('#title')?.textContent ?? ''");
    });

    it('should build expression for non-shadow selector with getAttribute', () => {
      const expr = buildShadowExpression('input', "getAttribute('placeholder')");
      expect(expr).toBe("document.querySelector('input')?.getAttribute('placeholder') ?? ''");
    });

    it('should build expression for single-level shadow piercing', () => {
      const expr = buildShadowExpression('my-comp >>> .btn', 'outerHTML');
      expect(expr).toBe("document.querySelector('my-comp')?.shadowRoot?.querySelector('.btn')?.outerHTML ?? ''");
    });

    it('should build expression for nested shadow piercing', () => {
      const expr = buildShadowExpression('outer >>> middle >>> .inner', 'textContent');
      expect(expr).toBe("document.querySelector('outer')?.shadowRoot?.querySelector('middle')?.shadowRoot?.querySelector('.inner')?.textContent ?? ''");
    });

    it('should reject a trailing >>> rather than compile querySelector with an empty string', () => {
      // querySelector('') throws "The provided selector is empty" inside the page, which
      // reads as a page bug rather than as the typo in the selector that it actually is.
      expect(() => buildShadowExpression('my-comp >>>', 'outerHTML')).toThrow('Invalid selector');
      expect(() => buildShadowExpression('>>> .btn', 'outerHTML')).toThrow('Invalid selector');
      expect(() => buildShadowExpression('a >>> >>> b', 'outerHTML')).toThrow('Invalid selector');
    });

    it('should return the bare element chain for an empty accessor', () => {
      // With the accessor appended unconditionally this produced `expr?. ?? ''` — a syntax
      // error that query --exists shipped on every >>> selector.
      const expr = buildShadowExpression('my-comp >>> .btn', '');
      expect(expr).toBe("document.querySelector('my-comp')?.shadowRoot?.querySelector('.btn')");
    });

    it('should trim whitespace around parts', () => {
      const expr = buildShadowExpression('  my-comp   >>>   .btn  ', 'outerHTML');
      expect(expr).toBe("document.querySelector('my-comp')?.shadowRoot?.querySelector('.btn')?.outerHTML ?? ''");
    });

    it('should escape special characters in selector parts', () => {
      const expr = buildShadowExpression("my-comp >>> it's", 'outerHTML');
      expect(expr).toBe("document.querySelector('my-comp')?.shadowRoot?.querySelector('it\\'s')?.outerHTML ?? ''");
    });
  });

  describe('buildElementExpression', () => {
    it('should resolve a plain CSS selector to a querySelector call', () => {
      const expr = buildElementExpression('.btn');
      expect(expr).toBe("document.querySelector('.btn')");
    });

    it('should resolve a single-level >>> selector through shadowRoot', () => {
      const expr = buildElementExpression('my-comp >>> .btn');
      expect(expr).toBe("document.querySelector('my-comp')?.shadowRoot?.querySelector('.btn')");
    });

    it('should resolve a nested >>> selector through multiple shadow roots', () => {
      const expr = buildElementExpression('outer >>> middle >>> .inner');
      expect(expr).toBe(
        "document.querySelector('outer')?.shadowRoot?.querySelector('middle')?.shadowRoot?.querySelector('.inner')"
      );
    });

    it('should trim whitespace around >>> parts', () => {
      const expr = buildElementExpression('  my-comp   >>>   .btn  ');
      expect(expr).toBe("document.querySelector('my-comp')?.shadowRoot?.querySelector('.btn')");
    });

    it('should optional-chain every shadowRoot hop, not just the host lookup', () => {
      // `a?.shadowRoot.querySelector(...)` only short-circuits when `a` is nullish. A host
      // that exists but has no shadowRoot — a closed root, an element that never attaches
      // one, a plain div — made the chain throw "Cannot read properties of null" in the
      // page, and callers read that as "element missing" or, worse, as a confident false.
      const expr = buildElementExpression('outer >>> middle >>> .inner');
      expect(expr).not.toContain('?.shadowRoot.querySelector');
      expect(expr).toBe(
        "document.querySelector('outer')?.shadowRoot?.querySelector('middle')?.shadowRoot?.querySelector('.inner')"
      );
    });

    it('should reject empty >>> segments', () => {
      expect(() => buildElementExpression('my-comp >>>')).toThrow('Invalid selector');
      expect(() => buildElementExpression('>>> .btn')).toThrow('Invalid selector');
    });

    it('should escape quotes in selector parts', () => {
      const expr = buildElementExpression("my-comp >>> it's");
      expect(expr).toBe("document.querySelector('my-comp')?.shadowRoot?.querySelector('it\\'s')");
    });
  });

  describe('buildShadowRectExpression', () => {
    it('should build rect expression for non-shadow selector', () => {
      const expr = buildShadowRectExpression('.btn');
      expect(expr).toContain("document.querySelector('.btn')");
      expect(expr).toContain('getBoundingClientRect');
      expect(expr).toContain('x:');
      expect(expr).toContain('y:');
      expect(expr).toContain('width:');
      expect(expr).toContain('height:');
    });

    it('should build rect expression for single-level shadow piercing', () => {
      const expr = buildShadowRectExpression('my-comp >>> .btn');
      expect(expr).toContain("document.querySelector('my-comp')?.shadowRoot?.querySelector('.btn')");
      expect(expr).toContain('getBoundingClientRect');
    });

    it('should build rect expression for nested shadow roots', () => {
      const expr = buildShadowRectExpression('outer >>> middle >>> .inner');
      expect(expr).toContain("document.querySelector('outer')?.shadowRoot?.querySelector('middle')?.shadowRoot?.querySelector('.inner')");
      expect(expr).toContain('getBoundingClientRect');
    });

    it('should return null when element not found via IIFE wrapper', () => {
      const expr = buildShadowRectExpression('.btn');
      expect(expr).toContain('(() => { const el = ');
      expect(expr).toContain("if (!el) return null");
    });
  });
});

describe('Profile Port Uniqueness', () => {
  it('should have unique ports for each profile', () => {
    const ports = Object.values(PROFILES).map((p) => p.port);
    const uniquePorts = new Set(ports);
    expect(uniquePorts.size).toBe(ports.length);
  });

  it('should have sequential port numbers', () => {
    const ports = Object.values(PROFILES)
      .map((p) => p.port)
      .sort((a, b) => a - b);

    const expectedPorts = [9230, 9231, 9232, 9233, 9234, 9235];
    expect(ports).toEqual(expectedPorts);
  });

  it('should not have port conflicts with common ports', () => {
    const ports = Object.values(PROFILES).map((p) => p.port);
    const commonPorts = [80, 443, 3000, 8080, 9000, 9222];

    commonPorts.forEach((commonPort) => {
      expect(ports).not.toContain(commonPort);
    });
  });
});