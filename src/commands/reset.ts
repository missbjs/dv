import { CDPClient } from '../cdp.js';
import { TabOptions, targetTab } from '../tab.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
import { OutputOptions, printStructured } from '../output.js';

export interface ResetOptions extends OutputOptions, TabOptions {
  profile: string;
  viewport?: boolean;
  userAgent?: boolean;
  timezone?: boolean;
  geolocation?: boolean;
  network?: boolean;
  allTabs?: boolean;
}

/** One clearable piece of emulation state. */
interface Clearer {
  key: 'viewport' | 'userAgent' | 'timezone' | 'geolocation' | 'network';
  label: string;
  run: (client: CDPClient) => Promise<void>;
}

const CLEARERS: Clearer[] = [
  { key: 'viewport', label: 'Viewport (device metrics)', run: (c) => c.clearDeviceMetricsOverride() },
  { key: 'userAgent', label: 'User agent', run: (c) => c.clearUserAgentOverride() },
  { key: 'timezone', label: 'Timezone', run: (c) => c.clearTimezoneOverride() },
  { key: 'geolocation', label: 'Geolocation', run: (c) => c.clearGeolocationOverride() },
  { key: 'network', label: 'Network conditions', run: (c) => c.clearNetworkConditions() },
];

interface ClearResult {
  target: string;
  cleared: boolean;
  error?: string;
}

interface TabResult {
  id?: string;
  url?: string;
  results: ClearResult[];
}

/**
 * Take emulation overrides back off. With no flags it clears the whole bundle —
 * that is the form to reach for when a session has gone strange. Flags narrow it
 * to specific overrides, `--tab` to one tab and `--all-tabs` to every content tab.
 */
export async function reset(options: ResetOptions) {
  const port = getPortFromProfile(options.profile);
  const selected = CLEARERS.filter((c) => options[c.key]);
  // No flags at all → clear everything.
  const targets = selected.length > 0 ? selected : CLEARERS;
  const requestedTab = targetTab(options);

  try {
    // Overrides are per-tab. One tab by default (the same one every other dv
    // command talks to), or every content tab with --all-tabs — which is what
    // you want when `status` flags a tab that is not the one in front.
    const tabs: Array<{ id?: string; url?: string }> = options.allTabs
      ? await contentTabs(port)
      : [{ id: requestedTab }];

    if (tabs.length === 0) {
      throw new Error('No tab found. Make sure Chrome is running and a tab is open.');
    }

    const tabResults: TabResult[] = [];

    for (const tab of tabs) {
      const client = new CDPClient(port);
      const results: ClearResult[] = [];
      try {
        await client.connect(tab.id);
        for (const target of targets) {
          try {
            await target.run(client);
            results.push({ target: target.key, cleared: true });
          } catch (error) {
            results.push({
              target: target.key,
              cleared: false,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      } catch (error) {
        // The whole tab is unreachable — report every target as failed rather
        // than aborting the run and leaving the other tabs untouched.
        const message = error instanceof Error ? error.message : String(error);
        for (const target of targets) {
          results.push({ target: target.key, cleared: false, error: message });
        }
      } finally {
        await client.close();
      }
      tabResults.push({ id: tab.id, url: tab.url, results });
    }

    const failed = tabResults.flatMap((t) =>
      t.results.filter((r) => !r.cleared).map((r) => ({ ...r, tab: t.id }))
    );
    // Cleared on every tab that was targeted, so a partial failure never reads as a clean sweep.
    const cleared = targets
      .map((t) => t.key)
      .filter((key) => tabResults.every((t) => t.results.find((r) => r.target === key)?.cleared));

    if (printStructured({
      cleared,
      failed,
      tabs: tabResults.map((t) => ({
        id: t.id ?? null,
        url: t.url ?? null,
        cleared: t.results.filter((r) => r.cleared).map((r) => r.target),
        failed: t.results.filter((r) => !r.cleared).map((r) => ({ target: r.target, error: r.error })),
      })),
    }, options)) {
      if (failed.length > 0) process.exit(1);
      return;
    }

    const scope = options.allTabs ? ` across ${tabResults.length} tab(s)` : '';
    console.log(chalk.blue(
      (targets.length === CLEARERS.length ? 'Resetting emulation state' : 'Resetting selected emulation state') + scope + '...'
    ));

    for (const tab of tabResults) {
      if (options.allTabs) {
        console.log(chalk.gray(`  ${tab.url ?? tab.id}`));
      }
      for (const target of targets) {
        const result = tab.results.find((r) => r.target === target.key)!;
        const indent = options.allTabs ? '    ' : '  ';
        if (result.cleared) {
          console.log(chalk.green(`${indent}✓ ${target.label}`));
        } else {
          console.log(chalk.red(`${indent}✗ ${target.label} — ${result.error}`));
        }
      }
    }

    if (failed.length > 0) {
      console.error(chalk.red(`\n${failed.length} override(s) could not be cleared`));
      process.exit(1);
    }

    console.log(chalk.green.bold('\n✓ Emulation state reset'));
    console.log(chalk.gray('Window bounds were not touched.'));
    if (!options.allTabs) {
      // An override on a background tab is invisible to a single-tab reset.
      console.log(chalk.gray(`Overrides are per-tab; use --all-tabs to cover every open tab.`));
    }
    if (targets.length === CLEARERS.length) {
      // Worth saying out loud: the viewport is the only override that outlives
      // the command that set it, so the rest are usually already gone.
      console.log(chalk.gray('The viewport is the only override that survives a dv command exiting;'));
      console.log(chalk.gray('user agent, timezone, geolocation and throttling end with their own command.'));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }
}

/** Every content tab on the profile, skipping DevTools' own targets. */
async function contentTabs(port: number): Promise<Array<{ id: string; url: string }>> {
  const client = new CDPClient(port);
  const targets = await client.getTargets();
  return targets
    .filter((t) => t.type === 'page' && !t.url.startsWith('devtools://'))
    .map((t) => ({ id: t.id, url: t.url }));
}
