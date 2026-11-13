import { describe, it, expect } from 'vitest';
import { NetworkStore } from '../src/network-store.js';

const request = (url = 'https://example.test/a') => ({ requestId: 'r1', loaderId: 'l1', frameId: 'f1', timestamp: 10, wallTime: 1700000000, type: 'Fetch', request: { url, method: 'POST', headers: { Accept: 'application/json' }, postData: 'hello' } });

describe('persistent network store', () => {
  it('retains non-destructive tab-scoped history with globally unique entry IDs', () => {
    const store = new NetworkStore();
    store.event('a', 'tab-a', 'Network.requestWillBeSent', request());
    store.event('b', 'tab-b', 'Network.requestWillBeSent', request());
    expect(store.list('tab-a')).toHaveLength(1);
    expect(store.list('tab-a')).toHaveLength(1);
    expect(store.list()[0].id).not.toBe(store.list()[1].id);
    expect(store.find(store.list()[0].id)?.method).toBe('POST');
  });
  it('separates redirect hops and records completion, failure and body availability', () => {
    const store = new NetworkStore();
    store.event('s', 'tab', 'Network.requestWillBeSent', request());
    store.event('s', 'tab', 'Network.requestWillBeSent', { ...request('https://example.test/b'), timestamp: 11, redirectResponse: { status: 302, headers: { Location: '/b' } } });
    store.event('s', 'tab', 'Network.responseReceived', { requestId: 'r1', response: { status: 200, mimeType: 'application/json', headers: {} } });
    const current = store.event('s', 'tab', 'Network.loadingFinished', { requestId: 'r1', timestamp: 12, encodedDataLength: 5 })!;
    store.setBody(current.id, { body: 'hello', base64Encoded: false });
    expect(store.list().map(r => r.status)).toEqual([302, 200]);
    expect(store.list()[0].state).toBe('redirected');
    expect(store.find(current.id)?.body?.body).toBe('hello');
    store.event('s', 'tab', 'Network.requestWillBeSent', { ...request(), requestId: 'fail' });
    store.event('s', 'tab', 'Network.loadingFailed', { requestId: 'fail', timestamp: 13, errorText: 'net::ERR_FAILED' });
    expect(store.list()[2].errorText).toBe('net::ERR_FAILED');
  });
  it('clears bodies and ignores late completion from before clear', () => {
    const store = new NetworkStore();
    const row = store.event('s', 'tab', 'Network.requestWillBeSent', request())!;
    store.clear();
    store.setBody(row.id, { body: 'secret', base64Encoded: false });
    store.event('s', 'tab', 'Network.loadingFinished', { requestId: 'r1', timestamp: 12 });
    expect(store.list()).toEqual([]);
    store.event('s', 'tab', 'Network.requestWillBeSent', request());
    expect(store.list()[0].id).not.toBe(row.id);
  });
  it('clears only a named tab and preserves other tabs and their bodies', () => {
    const store = new NetworkStore();
    const a = store.event('a', 'tab-a', 'Network.requestWillBeSent', request())!;
    const b = store.event('b', 'tab-b', 'Network.requestWillBeSent', request())!;
    store.setBody(a.id, { body: 'private-a', base64Encoded: false });
    store.setBody(b.id, { body: 'private-b', base64Encoded: false });
    store.clear('tab-a');
    expect(store.find(a.id)).toBeUndefined();
    expect(store.find(b.id)?.body?.body).toBe('private-b');
    expect(store.find(b.id, 'tab-a')).toBeUndefined();
  });
  it('rejects ambiguous raw IDs and accepts unique saved IDs', () => {
    const store = new NetworkStore();
    const first = store.event('a', 'tab-a', 'Network.requestWillBeSent', request())!;
    store.event('b', 'tab-b', 'Network.requestWillBeSent', request());
    expect(() => store.find('r1')).toThrow('Ambiguous');
    expect(store.find('r1', 'tab-a')?.id).toBe(first.id);
    expect(store.find(first.id)?.tabId).toBe('tab-a');
  });
  it('counts base64 bodies by decoded bytes and refuses oversized bodies', () => {
    const store = new NetworkStore({ maxBodyBytes: 3, maxBodySize: 3 });
    const row = store.event('s', 'tab', 'Network.requestWillBeSent', request())!;
    store.setBody(row.id, { body: 'YWJj', base64Encoded: true });
    expect(store.find(row.id)?.bodyState).toBe('available');
    store.setBody(row.id, { body: 'YWJjZA==', base64Encoded: true });
    expect(store.find(row.id)?.bodyState).toBe('too-large');
    expect(store.find(row.id)?.body).toBeUndefined();
  });
  it('bounds entries and body bytes without losing response metadata', () => {
    const store = new NetworkStore({ maxEntries: 2, maxBodyBytes: 5, maxBodySize: 4 });
    for (let i = 0; i < 3; i++) {
      const row = store.event('s', 'tab', 'Network.requestWillBeSent', { ...request(), requestId: String(i) })!;
      store.setBody(row.id, { body: '1234', base64Encoded: false });
    }
    expect(store.list()).toHaveLength(2);
    expect(store.list().filter(r => r.body)).toHaveLength(1);
    expect(store.list()[0].bodyState).toBe('evicted');
    store.setBody(store.list()[1].id, { body: '12345', base64Encoded: false });
    expect(store.list()[1].bodyState).toBe('too-large');
  });
});
