import { describe, it, expect } from 'vitest';
import { PROFILES, getProfile, getProfileByPort, listProfiles } from '../src/profiles.js';
import { TEST_PROFILES, getTestProfile, getTestPort } from './test-profiles.js';

describe('Production Profiles', () => {
  describe('PROFILES configuration', () => {
    it('should have 6 profiles defined', () => {
      expect(Object.keys(PROFILES)).toHaveLength(6);
    });

    it('should have correct profile names', () => {
      const expectedProfiles = [
        'profile-1',
        'profile-2',
        'profile-3',
        'profile-4',
        'profile-5',
        'profile-6',
      ];
      expect(Object.keys(PROFILES)).toEqual(expectedProfiles);
    });

    it('should use correct port range (9230-9235)', () => {
      const ports = Object.values(PROFILES).map((p) => p.port);
      expect(ports).toEqual([9230, 9231, 9232, 9233, 9234, 9235]);
    });

    it('should have purpose defined for each profile', () => {
      Object.values(PROFILES).forEach((profile) => {
        expect(profile).toHaveProperty('purpose');
        expect(typeof profile.purpose).toBe('string');
        expect(profile.purpose.length).toBeGreaterThan(0);
      });
    });

    it('should have port defined for each profile', () => {
      Object.values(PROFILES).forEach((profile) => {
        expect(profile).toHaveProperty('port');
        expect(typeof profile.port).toBe('number');
        expect(profile.port).toBeGreaterThanOrEqual(9230);
        expect(profile.port).toBeLessThanOrEqual(9235);
      });
    });
  });

  describe('getProfile', () => {
    it('should return profile config for valid profile name', () => {
      const profile = getProfile('profile-1');
      expect(profile).toBeDefined();
      expect(profile?.port).toBe(9230);
      expect(profile?.purpose).toBe('General use');
    });

    it('should return undefined for invalid profile name', () => {
      const profile = getProfile('invalid-profile');
      expect(profile).toBeUndefined();
    });

    it('should return undefined for test profile name', () => {
      const profile = getProfile('test-profile-1');
      expect(profile).toBeUndefined();
    });
  });

  describe('getProfileByPort', () => {
    it('should return profile by port number', () => {
      const result = getProfileByPort(9230);
      expect(result).toBeDefined();
      expect(result?.[0]).toBe('profile-1');
      expect(result?.[1].port).toBe(9230);
    });

    it('should return undefined for invalid port', () => {
      const result = getProfileByPort(9999);
      expect(result).toBeUndefined();
    });

    it('should return undefined for test port', () => {
      const result = getProfileByPort(9240);
      expect(result).toBeUndefined();
    });
  });

  describe('listProfiles', () => {
    it('should return array of all profiles', () => {
      const profiles = listProfiles();
      expect(profiles).toHaveLength(6);
    });

    it('should return profiles with correct structure', () => {
      const profiles = listProfiles();
      profiles.forEach((profile) => {
        expect(profile).toHaveProperty('name');
        expect(profile).toHaveProperty('port');
        expect(profile).toHaveProperty('purpose');
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

    it('should use correct test port range (9240-9245)', () => {
      const ports = Object.values(TEST_PROFILES).map((p) => p.port);
      expect(ports).toEqual([9240, 9241, 9242, 9243, 9244, 9245]);
    });

    it('should not overlap with production ports', () => {
      const testPorts = Object.values(TEST_PROFILES).map((p) => p.port);
      const prodPorts = Object.values(PROFILES).map((p) => p.port);

      const overlap = testPorts.filter((port) => prodPorts.includes(port));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('getTestProfile', () => {
    it('should return test profile config', () => {
      const profile = getTestProfile('test-profile-1');
      expect(profile).toBeDefined();
      expect(profile?.port).toBe(9240);
    });

    it('should return undefined for invalid test profile name', () => {
      const profile = getTestProfile('invalid-test-profile');
      expect(profile).toBeUndefined();
    });

    it('should return undefined for production profile name', () => {
      const profile = getTestProfile('profile-1');
      expect(profile).toBeUndefined();
    });
  });

  describe('getTestPort', () => {
    it('should return correct port for test profile', () => {
      expect(getTestPort('test-profile-1')).toBe(9240);
      expect(getTestPort('test-profile-6')).toBe(9245);
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