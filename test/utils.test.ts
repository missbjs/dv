import { describe, it, expect } from 'vitest';
import { getPortFromProfile } from '../src/utils.js';
import { PROFILES } from '../src/profiles.js';

describe('Utility Functions', () => {
  describe('getPortFromProfile', () => {
    it('should return correct port for valid profile', () => {
      expect(getPortFromProfile('profile-1')).toBe(9230);
      expect(getPortFromProfile('profile-2')).toBe(9231);
      expect(getPortFromProfile('profile-3')).toBe(9232);
      expect(getPortFromProfile('profile-4')).toBe(9233);
      expect(getPortFromProfile('profile-5')).toBe(9234);
      expect(getPortFromProfile('profile-6')).toBe(9235);
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
      expect(() => getPortFromProfile('PROFILE-1')).toThrow();
      expect(() => getPortFromProfile('Profile-1')).toThrow();
    });

    it('should reject test profile names', () => {
      expect(() => getPortFromProfile('test-profile-1')).toThrow();
    });

    it('should return number type', () => {
      const port = getPortFromProfile('profile-1');
      expect(typeof port).toBe('number');
    });

    it('should return port in valid range', () => {
      const port = getPortFromProfile('profile-1');
      expect(port).toBeGreaterThanOrEqual(9230);
      expect(port).toBeLessThanOrEqual(9235);
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