import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
export async function throttle(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect();
        // Emulation domain doesn't have an enable method; try setNetworkConditions directly
        let conditions;
        if (options.offline) {
            conditions = { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 };
            console.log(chalk.blue('Setting network: Offline'));
        }
        else if (options.slow3g) {
            conditions = { offline: false, latency: 2000, downloadThroughput: 500000, uploadThroughput: 500000 };
            console.log(chalk.blue('Setting network: Slow 3G'));
        }
        else if (options.fast3g) {
            conditions = { offline: false, latency: 560, downloadThroughput: 1600000, uploadThroughput: 750000 };
            console.log(chalk.blue('Setting network: Fast 3G'));
        }
        else {
            conditions = { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 };
            console.log(chalk.blue('Setting network: No throttling'));
        }
        await client.setNetworkConditions(conditions.offline, conditions.latency, conditions.downloadThroughput, conditions.uploadThroughput);
        console.log(chalk.green('✓ Network conditions set'));
        if (conditions.offline) {
            console.log(chalk.gray('Status: Offline'));
        }
        else {
            console.log(chalk.gray(`Latency: ${conditions.latency}ms`));
            console.log(chalk.gray(`Download: ${conditions.downloadThroughput} bytes/s`));
            console.log(chalk.gray(`Upload: ${conditions.uploadThroughput} bytes/s`));
        }
    }
    catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
    }
    finally {
        await client.close();
    }
}
//# sourceMappingURL=throttle.js.map