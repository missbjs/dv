import { getProfile } from './profiles.js';
import chalk from 'chalk';

export function getPortFromProfile(profileName: string): number {
  const profile = getProfile(profileName);
  if (!profile) {
    console.error(chalk.red(`Profile not found: ${profileName}`));
    console.error(chalk.yellow('Available profiles:'));
    console.error('  dv1 through dv6');
    process.exit(1);
  }
  return profile.port;
}
