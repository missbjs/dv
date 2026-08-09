import { describe, it, expect } from 'vitest';
import { parse as yamlParse } from 'yaml';
import { wantsStructured, renderStructured, printStructured } from '../src/output.js';

describe('wantsStructured', () => {
  it('is false when neither flag is set', () => {
    expect(wantsStructured({})).toBe(false);
  });

  it('is true when --json is set', () => {
    expect(wantsStructured({ json: true })).toBe(true);
  });

  it('is true when --yaml is set', () => {
    expect(wantsStructured({ yaml: true })).toBe(true);
  });

  it('is true when both are set', () => {
    expect(wantsStructured({ json: true, yaml: true })).toBe(true);
  });
});

describe('renderStructured', () => {
  const data = { a: 1, b: ['x', 'y'], c: { nested: true } };

  it('renders pretty JSON with 2-space indent by default (json flag)', () => {
    const out = renderStructured(data, { json: true });
    expect(out).toBe(JSON.stringify(data, null, 2));
  });

  it('renders JSON identically to the previous inline JSON.stringify call', () => {
    // Guards backward-compatibility of existing --json output byte-for-byte.
    const out = renderStructured({ count: 5 }, { json: true });
    expect(out).toBe(JSON.stringify({ count: 5 }, null, 2));
  });

  it('renders valid YAML that round-trips to the same object', () => {
    const out = renderStructured(data, { yaml: true });
    expect(yamlParse(out)).toEqual(data);
  });

  it('does not leave a trailing newline on YAML output', () => {
    const out = renderStructured(data, { yaml: true });
    expect(out.endsWith('\n')).toBe(false);
  });

  it('yaml takes precedence when both flags are set', () => {
    const out = renderStructured(data, { json: true, yaml: true });
    // JSON pretty output starts with "{"; YAML for an object does not.
    expect(out.startsWith('{')).toBe(false);
    expect(yamlParse(out)).toEqual(data);
  });

  it('renders null as JSON "null"', () => {
    expect(renderStructured(null, { json: true })).toBe('null');
  });

  it('renders null as YAML "null"', () => {
    expect(renderStructured(null, { yaml: true })).toBe('null');
  });
});

describe('printStructured', () => {
  it('returns false and prints nothing when no structured flag is set', () => {
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: any[]) => { logs.push(args.join(' ')); };
    try {
      const printed = printStructured({ a: 1 }, {});
      expect(printed).toBe(false);
      expect(logs).toHaveLength(0);
    } finally {
      console.log = orig;
    }
  });

  it('returns true and prints JSON when --json is set', () => {
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: any[]) => { logs.push(args.join(' ')); };
    try {
      const printed = printStructured({ a: 1 }, { json: true });
      expect(printed).toBe(true);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toBe(JSON.stringify({ a: 1 }, null, 2));
    } finally {
      console.log = orig;
    }
  });

  it('returns true and prints YAML when --yaml is set', () => {
    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: any[]) => { logs.push(args.join(' ')); };
    try {
      const printed = printStructured({ a: 1 }, { yaml: true });
      expect(printed).toBe(true);
      expect(logs).toHaveLength(1);
      expect(yamlParse(logs[0])).toEqual({ a: 1 });
    } finally {
      console.log = orig;
    }
  });
});
