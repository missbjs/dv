import { CDPClient } from '../cdp.js';
import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
import { getProfileByPort } from '../profiles.js';

const DEVICES: Record<string, { width: number; height: number; deviceScaleFactor: number; mobile: boolean; userAgent: string }> = {
  'iphone-13': { width: 390, height: 844, deviceScaleFactor: 3, mobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' },
  'iphone-se': { width: 375, height: 667, deviceScaleFactor: 2, mobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' },
  'pixel-5': { width: 393, height: 851, deviceScaleFactor: 2.75, mobile: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36' },
  'samsung-s21': { width: 360, height: 800, deviceScaleFactor: 3, mobile: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36' },
  'ipad-pro': { width: 1024, height: 1366, deviceScaleFactor: 2, mobile: false, userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' },
  'ipad-air': { width: 820, height: 1180, deviceScaleFactor: 2, mobile: false, userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' },
};

export interface EmulateOptions extends TabOptions {
  profile: string;
  device: string;
  /** Load this URL inside the same CDP session, so the site sees the device user agent. */
  navigate?: string;
  /** Reload the current page inside the same CDP session, for the same reason. */
  reload?: boolean;
}

export async function emulate(options: EmulateOptions) {
  const client = new CDPClient(getPortFromProfile(options.profile));

  try {
    await client.connect(targetTab(options));

    const device = DEVICES[options.device.toLowerCase()];
    if (!device) {
      console.error(chalk.red(`Unknown device: ${options.device}`));
      console.log(chalk.yellow('\nAvailable devices:'));
      Object.keys(DEVICES).forEach(d => console.log(chalk.white(`  - ${d}`)));
      process.exit(1);
    }

    console.log(chalk.blue(`Emulating ${options.device}`));
    await client.setDeviceMetricsOverride(device.width, device.height, device.deviceScaleFactor, device.mobile);
    await client.setUserAgentOverride(device.userAgent);

    // The user agent only reaches the server if the request goes out while this
    // session is still open. --navigate / --reload are the only way to get a
    // UA-branching site to serve its mobile HTML, because a later dv command
    // runs on a new connection with the override already gone.
    let loaded: string | undefined;
    if (options.navigate) {
      console.log(chalk.blue(`Loading ${options.navigate} as ${options.device}...`));
      await client.navigateAndWait(options.navigate);
      loaded = options.navigate;
    } else if (options.reload) {
      console.log(chalk.blue(`Reloading as ${options.device}...`));
      await client.reloadAndWait(1000);
      loaded = 'the current page';
    }

    console.log(chalk.green('✓ Device emulation enabled'));
    // Split by lifetime, not by parameter list: Chrome keeps the resized widget
    // after the CDP session goes away, but hands everything else back. Printing
    // all five as one block reads as a promise that the next command breaks.
    console.log(chalk.gray('Outlives this command:'));
    console.log(chalk.gray(`  Width: ${device.width}px`));
    console.log(chalk.gray(`  Height: ${device.height}px`));
    console.log(chalk.gray('  CSS and media queries stay at this size, so layout is the mobile one.'));
    if (loaded) {
      console.log(chalk.gray(`  ${loaded} was loaded with the device user agent, so what the`));
      console.log(chalk.gray('  server returned is the mobile response, and it stays on the page.'));
    }
    console.log(chalk.gray('Reverts the moment this command exits:'));
    console.log(chalk.gray(`  Device Scale Factor: ${device.deviceScaleFactor} (back to the display's own)`));
    console.log(chalk.gray(`  Mobile: ${device.mobile} (and screen.width/height with it)`));
    console.log(chalk.gray(`  User Agent: ${device.userAgent.substring(0, 60)}...`));
    if (loaded) {
      console.log(chalk.gray('The next dv command runs with the real user agent again, so re-run this'));
      console.log(chalk.gray('command with --navigate/--reload whenever the page must be re-fetched.'));
    } else {
      console.log(chalk.gray('A site that branches on the user agent still sees desktop Chrome on the'));
      console.log(chalk.gray('next command; only the viewport size makes it that far. To have the site'));
      console.log(chalk.gray('serve its mobile response, load the page from inside this command:'));
      console.log(chalk.gray(`  emulate -d ${options.device} --navigate <url>   (or --reload)`));
    }
    const bin = getProfileByPort(getPortFromProfile(options.profile))?.[0] ?? 'dv';
    console.log(chalk.gray(`Undo the viewport with: ${bin} reset --viewport${options.tab ? ` --tab ${options.tab}` : ''}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}