import { CDPClient } from '../cdp.js';
import chalk from 'chalk';

const DEVICES: Record<string, { width: number; height: number; deviceScaleFactor: number; mobile: boolean; userAgent: string }> = {
  'iphone-13': { width: 390, height: 844, deviceScaleFactor: 3, mobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1' },
  'iphone-13-pro': { width: 390, height: 844, deviceScaleFactor: 3, mobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1' },
  'iphone-se': { width: 375, height: 667, deviceScaleFactor: 2, mobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1' },
  'pixel-5': { width: 393, height: 851, deviceScaleFactor: 2.75, mobile: true, userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36' },
  'samsung-s21': { width: 360, height: 800, deviceScaleFactor: 3, mobile: true, userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36' },
  'ipad-pro': { width: 1024, height: 1366, deviceScaleFactor: 2, mobile: false, userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1' },
  'ipad-air': { width: 820, height: 1180, deviceScaleFactor: 2, mobile: false, userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1' },
};

export interface EmulateOptions {
  port: number;
  device: string;
}

export async function emulate(options: EmulateOptions) {
  const client = new CDPClient(options.port);

  try {
    await client.loadState();
    await client.connect();

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

    console.log(chalk.green('✓ Device emulation enabled'));
    console.log(chalk.gray(`Width: ${device.width}px`));
    console.log(chalk.gray(`Height: ${device.height}px`));
    console.log(chalk.gray(`Device Scale Factor: ${device.deviceScaleFactor}`));
    console.log(chalk.gray(`Mobile: ${device.mobile}`));
    console.log(chalk.gray(`User Agent: ${device.userAgent.substring(0, 60)}...`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  } finally {
    await client.close();
  }
}
