import { Profile } from '../src/types.js';

/**
 * Test profile configuration - separate from production ports
 * Test ports: 9240-9245
 * Production ports: 9230-9235
 */
export const TEST_PROFILES: Record<string, Profile> = {
  'test-dv1': { port: 9240 },
  'test-dv2': { port: 9241 },
  'test-dv3': { port: 9242 },
  'test-dv4': { port: 9243 },
  'test-dv5': { port: 9244 },
  'test-dv6': { port: 9245 },
};

export function getTestProfile(name: string): Profile | undefined {
  return TEST_PROFILES[name];
}

export function getTestPort(profileName: string): number {
  const profile = TEST_PROFILES[profileName];
  if (!profile) {
    throw new Error(`Test profile not found: ${profileName}`);
  }
  return profile.port;
}

export const TEST_PORT = 9240; // Default test port
export const TEST_PROFILE_NAME = 'test-dv1';