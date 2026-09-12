import { describe, it, expect } from 'vitest';
import { targetTab } from '../src/tab.js';

describe('targetTab', () => {
  it('returns the tab named by --tab', () => {
    expect(targetTab({ tab: 'ABC123' })).toBe('ABC123');
  });

  it('still accepts the deprecated --tab-id', () => {
    expect(targetTab({ tabId: 'ABC123' })).toBe('ABC123');
  });

  it('prefers --tab when both are given', () => {
    expect(targetTab({ tab: 'new', tabId: 'old' })).toBe('new');
  });

  it('returns undefined when no tab is named, so the default tab is used', () => {
    expect(targetTab({})).toBeUndefined();
  });

  it('treats an empty string as no tab, rather than passing it to CDP', () => {
    // Commander can hand through an empty value; '' as a tab ID would fail the
    // lookup instead of falling back to the default tab.
    expect(targetTab({ tab: '' })).toBeUndefined();
    expect(targetTab({ tab: '', tabId: 'old' })).toBe('old');
  });
});
