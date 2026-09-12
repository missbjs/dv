import { ensureChromeRunning } from '../ensureChrome.js';
import { getPortFromProfile } from '../utils.js';
import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
export async function start(options) {
    // Check if already running first so we can show details
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        const targets = await client.getTargets();
        console.log(chalk.green.bold('✓ Chrome is already running on port ' + getPortFromProfile(options.profile)));
        console.log(chalk.gray(`DevTools URL: http://localhost:${getPortFromProfile(options.profile)}`));
        console.log(chalk.gray(`Open pages: ${targets.filter(t => t.type === 'page').length}`));
        return;
    }
    catch {
        // Not running — delegate to ensureChromeRunning
    }
    await ensureChromeRunning(options.profile, options.headless);
    // Cheap insurance, and safe only here: a brand-new session carrying a device
    // metrics override from a previous one is never intentional. Deliberate
    // emulation set later in the session is untouched — dv never clears on connect.
    const fresh = new CDPClient(getPortFromProfile(options.profile));
    try {
        await fresh.connect();
        await fresh.clearDeviceMetricsOverride();
    }
    catch {
        // No tab to attach to yet, or Chrome is still coming up — nothing to clear.
    }
    finally {
        await fresh.close();
    }
}
//# sourceMappingURL=start.js.map