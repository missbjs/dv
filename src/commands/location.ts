import { CDPClient } from '../cdp.js';
import { sessionScopedNote } from '../emulation.js';
import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

export interface LocationOptions extends TabOptions {
  lat: number;
  lng: number;
  accuracy?: number;
  profile: string;
}

export async function location(options: LocationOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect(targetTab(options));

    console.log(chalk.blue(`Setting geolocation: ${options.lat}, ${options.lng}`));
    await client.setGeolocationOverride(options.lat, options.lng, options.accuracy || 100);

    console.log(chalk.green('✓ Geolocation override set'));
    console.log(chalk.gray(`Latitude: ${options.lat}`));
    console.log(chalk.gray(`Longitude: ${options.lng}`));
    if (options.accuracy) {
      console.log(chalk.gray(`Accuracy: ${options.accuracy}m`));
    }
    for (const line of sessionScopedNote('geolocation')) {
      console.log(chalk.gray(line));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}
