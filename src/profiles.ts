import { ProfileConfig } from './types.js';

export const PROFILES: ProfileConfig = {
  'profile-1': { port: 9230, purpose: 'OAuth pinned' },
  'profile-2': { port: 9231, purpose: 'Parallel testing' },
  'profile-3': { port: 9232, purpose: 'Parallel testing' },
  'profile-4': { port: 9233, purpose: 'Parallel testing' },
  'profile-5': { port: 9234, purpose: 'Parallel testing' },
  'profile-6': { port: 9235, purpose: 'Parallel testing' },
};

export function getProfile(name: string) {
  return PROFILES[name];
}

export function getProfileByPort(port: number) {
  return Object.entries(PROFILES).find(([_, config]) => config.port === port);
}

export function listProfiles() {
  return Object.entries(PROFILES).map(([name, config]) => ({
    name,
    port: config.port,
    purpose: config.purpose,
  }));
}