import { CDPClient } from '../cdp.js';
import { getPortFromProfile } from '../utils.js';
import chalk from 'chalk';
import { wantsStructured, renderStructured } from '../output.js';
import { probeViewport } from '../emulation.js';
export async function status(options) {
    const port = getPortFromProfile(options.profile);
    const client = new CDPClient(port);
    // --no-viewport skips the per-tab probe (one short-lived CDP connection each).
    const probeViewports = options.viewport !== false;
    try {
        const targets = await client.getTargets();
        const tabs = targets.filter(t => t.type === 'page');
        // Probe every content tab in parallel. A device-metrics override is
        // per-target and sticky, and nothing else in dv ever announces it.
        const viewports = probeViewports
            ? await Promise.all(tabs.map(tab => tab.url.startsWith('devtools://') ? Promise.resolve(null) : probeViewport(port, tab.id)))
            : tabs.map(() => null);
        const emulatedCount = viewports.filter(v => v?.emulated).length;
        // Two separate kinds of "don't know", both of which used to look like "fine":
        // a tab whose metrics can't settle the question, and a tab that never answered.
        const inconclusiveCount = viewports.filter(v => v && !v.conclusive).length;
        const unprobedCount = probeViewports
            ? tabs.filter((t, i) => !viewports[i] && !t.url.startsWith('devtools://')).length
            : 0;
        if (wantsStructured(options)) {
            console.log(renderStructured({
                running: true,
                port,
                devToolsUrl: `http://localhost:${port}`,
                emulatedTabs: emulatedCount,
                inconclusiveTabs: inconclusiveCount,
                unprobedTabs: unprobedCount,
                tabs: tabs.map((tab, index) => ({
                    index: index + 1,
                    title: tab.title,
                    url: tab.url,
                    id: tab.id,
                    viewport: viewports[index]
                        ? {
                            width: viewports[index].innerWidth,
                            height: viewports[index].innerHeight,
                            windowWidth: viewports[index].outerWidth,
                            windowHeight: viewports[index].outerHeight,
                            devicePixelRatio: viewports[index].devicePixelRatio,
                            emulated: viewports[index].emulated,
                            emulationReason: viewports[index].reason ?? null,
                            conclusive: viewports[index].conclusive,
                            inconclusiveReason: viewports[index].inconclusiveReason ?? null,
                        }
                        : null,
                })),
            }, options));
            return;
        }
        console.log(chalk.green.bold('✓ Chrome is running on port ' + port));
        console.log(chalk.gray(`DevTools URL: http://localhost:${port}`));
        console.log();
        if (tabs.length > 0) {
            console.log(chalk.blue(`Open tabs: ${tabs.length}`));
            tabs.forEach((tab, index) => {
                console.log(`  ○ ${index + 1}. ${tab.title}`);
                console.log(chalk.gray(`     URL: ${tab.url}`));
                console.log(chalk.gray(`     ID: ${tab.id}`));
                const vp = viewports[index];
                if (vp) {
                    const size = `${vp.innerWidth}x${vp.innerHeight}`;
                    if (vp.emulated) {
                        console.log(chalk.gray('     Viewport: ') +
                            chalk.yellow(`${size}  ⚠ emulated — window is ${vp.outerWidth}x${vp.outerHeight}`));
                    }
                    else if (!vp.conclusive) {
                        console.log(chalk.gray('     Viewport: ') +
                            chalk.yellow(`${size}  ⚠ cannot tell — ${vp.inconclusiveReason}`));
                    }
                    else {
                        console.log(chalk.gray(`     Viewport: ${size}`));
                    }
                }
                else if (probeViewports && !tab.url.startsWith('devtools://')) {
                    // The probe returned nothing at all — restricted page, or too slow.
                    console.log(chalk.gray('     Viewport: ') + chalk.yellow('not readable (tab did not answer)'));
                }
            });
            if (emulatedCount > 0) {
                console.log();
                console.log(chalk.yellow(`⚠ ${emulatedCount} tab(s) have an emulated viewport (${vpReason(viewports)}).`));
                console.log(chalk.gray(`  An override is per-tab and survives reloads and navigation.`));
                for (const line of clearHints(options.profile, tabs, viewports)) {
                    console.log(chalk.gray(`  ${line}`));
                }
            }
            if (inconclusiveCount + unprobedCount > 0) {
                console.log();
                console.log(chalk.yellow(`⚠ ${inconclusiveCount + unprobedCount} tab(s) could not be checked for an emulated viewport.`));
                console.log(chalk.gray(`  Bring the tab to the front (${options.profile} select <id>) and re-run status;`));
                console.log(chalk.gray('  chrome:// and other restricted pages cannot be probed at all.'));
            }
        }
        else {
            console.log(chalk.yellow('No open tabs'));
        }
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Chrome is not running')) {
            if (wantsStructured(options)) {
                console.log(renderStructured({ running: false, port }, options));
                return;
            }
            console.log(chalk.red.bold('✗ Chrome is not running on port ' + port));
            console.log(chalk.yellow('\nTo start Chrome:'));
            console.log(chalk.gray(`  ${options.profile} start`));
        }
        else {
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
            process.exit(1);
        }
    }
}
/** First detection reason among the flagged tabs, for the summary line. */
function vpReason(viewports) {
    return viewports.find(v => v?.emulated)?.reason ?? 'viewport does not match the window';
}
/**
 * Measured on Chrome 152: a tab that is not in front keeps reporting the inner
 * size its widget last settled at, so a background tab still reads as emulated
 * for a while after its override is genuinely gone. Said out loud here, because
 * the alternative — bringing tabs to front to measure them — would make `status`
 * steal focus, and `status` does not change state.
 */
const HIDDEN_TAB_CAVEAT = 'A background tab can keep reporting the old size until it is next in front.';
/**
 * The undo, aimed at the tabs that are actually emulated. A bare `resize 0 0`
 * only reaches the tab every other dv command talks to — the first content tab —
 * so anything else has to be named, or the report would point at a command that
 * cannot fix it.
 */
export function clearHints(profile, tabs, viewports) {
    const emulated = tabs.filter((_, i) => viewports[i]?.emulated);
    const defaultTab = tabs.find(t => !t.url.startsWith('devtools://')) ?? tabs[0];
    if (emulated.length === 1 && emulated[0].id === defaultTab?.id) {
        return [`Clear it with: ${profile} resize 0 0   (or ${profile} reset --viewport)`];
    }
    if (emulated.length === 1) {
        return [
            `Not the tab dv talks to by default, so name it:`,
            `  ${profile} resize 0 0 --tab ${emulated[0].id}`,
            HIDDEN_TAB_CAVEAT,
        ];
    }
    return [
        `Clear every tab at once: ${profile} reset --viewport --all-tabs`,
        `Or one at a time:`,
        ...emulated.map(t => `  ${profile} resize 0 0 --tab ${t.id}`),
        HIDDEN_TAB_CAVEAT,
    ];
}
//# sourceMappingURL=status.js.map