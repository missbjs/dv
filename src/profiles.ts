import { ProfileConfig } from './types.js';

export const PROFILES: ProfileConfig = {
  'dv1': { port: 9230 },
  'dv2': { port: 9231 },
  'dv3': { port: 9232 },
  'dv4': { port: 9233 },
  'dv5': { port: 9234 },
  'dv6': { port: 9235 },
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
  }));
}