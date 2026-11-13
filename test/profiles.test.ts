import { describe, it, expect } from 'vitest';
import { PROFILES, getProfile, getProfileByPort, listProfiles } from '../src/profiles.js';
import { TEST_PROFILES, getTestProfile, getTestPort } from './test-profiles.js';

describe('Production Profiles', () => {
  describe('PROFILES configuration', () => {
    it('should have 128 profiles defined', () => {
      expect(Object.keys(PROFILES)).toHaveLength(128);
    });

    it('should have correct profile names', () => {
      const expectedProfiles = Array.from({ length: 128 }, (_, i) => `dv${i + 1}`);
      expect(Object.keys(PROFILES)).toEqual(expectedProfiles);
    });

    it('should use correct port range (9230-9357)', () => {
      const ports = Object.values(PROFILES).map((p) => p.port);
      expect(ports).toEqual(Array.from({ length: 128 }, (_, i) => 9230 + i));
    });

    it('should have port defined for each profile', () => {
      Object.values(PROFILES).forEach((profile) => {
        expect(profile).toHaveProperty('port');
        expect(typeof profile.port).toBe('number');
        expect(profile.port).toBeGreaterThanOrEqual(9230);
        expect(profile.port).toBeLessThanOrEqual(9357);
      });
    });
  });

  describe('getProfile', () => {
    it.each(Array.from({ length: 128 }, (_, i) => [`dv${i + 1}`, 9230 + i] as const))(
      'maps %s to port %i and back', (name, port) => {
        expect(getProfile(name)).toEqual({ port });
        expect(getProfileByPort(port)).toEqual([name, { port }]);
      },
    );

    it.each(['dv0', 'dv129', 'dv01', 'dv024', 'dv0128', 'DV7', 'dv7 ', '../dv128', '__proto__', 'constructor', 'toString'])(
      'rejects non-registry name %s', name => {
        expect(getProfile(name)).toBeUndefined();
      },
    );
    it('should return profile config for valid profile name', () => {
      const profile = getProfile('dv1');
      expect(profile).toBeDefined();
      expect(profile?.port).toBe(9230);
    });

    it('should return undefined for invalid profile name', () => {
      const profile = getProfile('invalid-profile');
      expect(profile).toBeUndefined();
    });

    it('should return undefined for test profile name', () => {
      const profile = getProfile('test-dv1');
      expect(profile).toBeUndefined();
    });
  });

  describe('getProfileByPort', () => {
    it('should return profile by port number', () => {
      const result = getProfileByPort(9230);
      expect(result).toBeDefined();
      expect(result?.[0]).toBe('dv1');
      expect(result?.[1].port).toBe(9230);
    });

    it('should return undefined for invalid port', () => {
      const result = getProfileByPort(9999);
      expect(result).toBeUndefined();
    });

    it('should return undefined for test port', () => {
      const result = getProfileByPort(9430);
      expect(result).toBeUndefined();
    });
  });

  describe('listProfiles', () => {
    it('should return array of all profiles', () => {
      const profiles = listProfiles();
      expect(profiles).toHaveLength(128);
      expect(profiles).toEqual(Array.from({ length: 128 }, (_, i) => ({ name: `dv${i + 1}`, port: 9230 + i })));
    });

    it('should return profiles with correct structure', () => {
      const profiles = listProfiles();
      profiles.forEach((profile) => {
        expect(profile).toHaveProperty('name');
        expect(profile).toHaveProperty('port');
      });
    });

    it('should return profiles sorted by port', () => {
      const profiles = listProfiles();
      const ports = profiles.map((p) => p.port);
      expect(ports).toEqual([...ports].sort((a, b) => a - b));
    });
  });
});

describe('Test Profiles', () => {
  describe('TEST_PROFILES configuration', () => {
    it('should have 6 test profiles defined', () => {
      expect(Object.keys(TEST_PROFILES)).toHaveLength(6);
    });

    it('should use correct test port range (9430-9435)', () => {
      const ports = Object.values(TEST_PROFILES).map((p) => p.port);
      expect(ports).toEqual([9430, 9431, 9432, 9433, 9434, 9435]);
    });

    it('should not overlap with production ports', () => {
      const testPorts = Object.values(TEST_PROFILES).map((p) => p.port);
      const prodPorts = Object.values(PROFILES).map((p) => p.port);

      const overlap = testPorts.filter((port) => prodPorts.includes(port));
      expect(overlap).toHaveLength(0);
      const recorderPorts = prodPorts.map(port => port + 10000);
      expect(testPorts.filter(port => recorderPorts.includes(port))).toHaveLength(0);
    });
  });

  describe('getTestProfile', () => {
    it('should return test profile config', () => {
      const profile = getTestProfile('test-dv1');
      expect(profile).toBeDefined();
      expect(profile?.port).toBe(9430);
    });

    it('should return undefined for invalid test profile name', () => {
      const profile = getTestProfile('invalid-test-profile');
      expect(profile).toBeUndefined();
    });

    it('should return undefined for production profile name', () => {
      const profile = getTestProfile('dv1');
      expect(profile).toBeUndefined();
    });
  });

  describe('getTestPort', () => {
    it('should return correct port for test profile', () => {
      expect(getTestPort('test-dv1')).toBe(9430);
      expect(getTestPort('test-dv6')).toBe(9435);
    });

    it('should throw error for invalid test profile', () => {
      expect(() => getTestPort('invalid-profile')).toThrow('Test profile not found');
    });
  });
});

describe('Profile Separation', () => {
  it('should maintain strict separation between test and production profiles', () => {
    const prodProfileNames = Object.keys(PROFILES);
    const testProfileNames = Object.keys(TEST_PROFILES);

    // No overlap in profile names
    const nameOverlap = prodProfileNames.filter((name) => testProfileNames.includes(name));
    expect(nameOverlap).toHaveLength(0);

    // No overlap in ports
    const prodPorts = Object.values(PROFILES).map((p) => p.port);
    const testPorts = Object.values(TEST_PROFILES).map((p) => p.port);
    const portOverlap = prodPorts.filter((port) => testPorts.includes(port));
    expect(portOverlap).toHaveLength(0);
  });

  it('should have distinct naming convention', () => {
    const prodNames = Object.keys(PROFILES);
    const testNames = Object.keys(TEST_PROFILES);

    // All production profiles should not have 'test' in name
    prodNames.forEach((name) => {
      expect(name).not.toMatch(/^test-/);
    });

    // All test profiles should have 'test' prefix
    testNames.forEach((name) => {
      expect(name).toMatch(/^test-/);
    });
  });
});