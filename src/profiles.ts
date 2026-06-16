import { ProfileConfig } from './types.js';

export const PROFILES: ProfileConfig = {
  'profile-qmdj-1': { port: 9222, purpose: 'OAuth pinned' },
  'profile-qmdj-2': { port: 9223, purpose: 'Parallel testing' },
  'profile-qmdj-3': { port: 9224, purpose: 'Parallel testing' },
  'profile-qmdj-4': { port: 9225, purpose: 'Parallel testing' },
  'profile-qmdj-5': { port: 9226, purpose: 'Parallel testing' },
  'profile-qmdj-6': { port: 9227, purpose: 'Parallel testing' },
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