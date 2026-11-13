import { ensureChromeRunning } from '../ensureChrome.js';
import { getPortFromProfile } from '../utils.js';
import { CDPClient } from '../cdp.js';
import { migrateProfile, pendingMigration } from '../runtime.js';
import chalk from 'chalk';
import { ensureNetworkRecorder, historyTab } from '../network-recorder.js';
export async function start(options) {
    // Before anything else: an old-location profile is moved to the shared root, or
    // start refuses. A Chrome already running on the old folder must not be moved
    // from under it, so that case is reported instead of migrated.
    const pending = pendingMigration(options.profile);
    if (pending) {
        const running = await new CDPClient(getPortFromProfile(options.profile)).getTargets().then(() => true, () => false);
        if (running) {
            console.error(chalk.red(`Chrome on ${options.profile} is running from the old profile folder ${pending}. ` +
                `Run "${options.profile} stop", then "${options.profile} start" to move it to the shared location.`));
            process.exit(1);
        }
        try {
            migrateProfile(options.profile);
        }
        catch (e) {
            console.error(chalk.red(e.message));
            process.exit(1);
        }
    }
    // Check if already running first so we can show details
    const client = new CDPClient(getPortFromProfile(options.profile));
    const targets = await client.getTargets().catch(() => null);
    if (targets) {
        await ensureNetworkRecorder(options.profile);
        if (targets.some(t => t.type === 'page'))
            await historyTab(options.profile);
        console.log(chalk.green.bold('✓ Chrome is already running on port ' + getPortFromProfile(options.profile)));
        console.log(chalk.gray(`DevTools URL: http://localhost:${getPortFromProfile(options.profile)}`));
        console.log(chalk.gray(`Open pages: ${targets.filter(t => t.type === 'page').length}`));
        console.log(chalk.gray(targets.some(t => t.type === 'page')
            ? 'Persistent network recorder attached'
            : 'Persistent network recorder service ready; idle until a page is selected'));
        return;
    }
    await ensureChromeRunning(options.profile, options.headless);
    // Recording readiness is not best-effort emulation cleanup. Surface attachment
    // or focus errors rather than reporting a freshly launched browser as captured.
    await historyTab(options.profile);
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