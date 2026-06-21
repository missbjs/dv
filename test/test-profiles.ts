import { Profile } from '../src/types.js';

/**
 * Test profile configuration - separate from production ports
 * Test ports: 9240-9245
 * Production ports: 9230-9235
 */
export const TEST_PROFILES: Record<string, Profile> = {
  'test-profile-1': { port: 9240, purpose: 'Test instance 1' },
  'test-profile-2': { port: 9241, purpose: 'Test instance 2' },
  'test-profile-3': { port: 9242, purpose: 'Test instance 3' },
  'test-profile-4': { port: 9243, purpose: 'Test instance 4' },
  'test-profile-5': { port: 9244, purpose: 'Test instance 5' },
  'test-profile-6': { port: 9245, purpose: 'Test instance 6' },
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
export const TEST_PROFILE_NAME = 'test-profile-1';