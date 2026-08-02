#!/usr/bin/env node

import { Command, Option } from 'commander';
import { start } from './commands/start.js';
import { stop } from './commands/stop.js';
import { status } from './commands/status.js';
import { navigate } from './commands/navigate.js';
import { evalCommand } from './commands/eval.js';
import { snapshot } from './commands/snapshot.js';
import { screenshot } from './commands/screenshot.js';
import { consoleCommand } from './commands/console.js';
import { click } from './commands/click.js';
import { fill } from './commands/fill.js';
import { type } from './commands/type.js';
import { key } from './commands/key.js';
import { tabs } from './commands/tabs.js';
import { select } from './commands/select.js';
import { newPage } from './commands/new.js';
import { close } from './commands/close.js';
import { resize } from './commands/resize.js';
import { monitor } from './commands/monitor.js';
import { query } from './commands/query.js';
import { listProfiles } from './profiles.js';
// Network commands
import { network } from './commands/network.js';
import { intercept } from './commands/intercept.js';
import { request } from './commands/request.js';
import { clearCache } from './commands/clear-cache.js';
// DOM commands
import { inspect } from './commands/inspect.js';
import { queryAll } from './commands/query-all.js';
import { getText } from './commands/get-text.js';
import { getHtml } from './commands/get-html.js';
import { setText } from './commands/set-text.js';
import { setHtml } from './commands/set-html.js';
import { setAttribute } from './commands/set-attribute.js';
// Emulation commands
import { emulate } from './commands/emulate.js';
import { location } from './commands/location.js';
import { userAgent } from './commands/user-agent.js';
import { timezone } from './commands/timezone.js';
import { throttle } from './commands/throttle.js';
// Storage commands
import { cookies } from './commands/cookies.js';
import { cookiesClear } from './commands/cookies-clear.js';
import { storageClear } from './commands/storage-clear.js';
import { localStorage } from './commands/local-storage.js';
import { sessionStorage } from './commands/session-storage.js';
import chalk from 'chalk';

const program = new Command();

// Detect which binary was invoked for help text display
const binName = process.env.DV_BIN_NAME || 'dv';
program
  .name(binName)
  .description('Chrome DevTools Protocol CLI wrapper')
  .version('1.0.0');

// Create --profile option (hidden when invoked via dv1-dv6 wrappers)
const profileOption = new Option('--profile <profile>', 'Profile name (dv1 through dv6)').makeOptionMandatory();
if (process.env.DV_BIN_NAME) {
  profileOption.hidden = true;
}

// Start Chrome
program
  .command('start')
  .description('Start Chrome with remote debugging')
  .addOption(profileOption)
  .option('--headless', 'Run in headless mode (no visible window)')
  .action(start);

// Status
program
  .command('status')
  .description('Check if Chrome is running and show open tabs')
  .addOption(profileOption)
  .action(status);

// Stop Chrome
program
  .command('stop')
  .description('Stop Chrome process on specified port')
  .addOption(profileOption)
  .action(stop);

// Navigate / goto
program
  .command('navigate')
  .alias('goto')
  .description('Navigate to URL on the current tab')
  .addOption(profileOption)
  .argument('<url>', 'URL to navigate to')
  .action((url: string, options: Record<string, any>) => {
    navigate({ ...options, url, profile: options.profile || process.env.DV_PROFILE! });
  });

// Evaluate JavaScript
program
  .command('eval')
  .description('Evaluate JavaScript in the tab')
  .addOption(profileOption)
  .option('-s, --script <script>', 'JavaScript expression to evaluate')
  .option('-f, --file <file>', 'JavaScript file to evaluate')
  .option('--json', 'Output as JSON')
  .action(evalCommand);

// Take snapshot
program
  .command('snapshot')
  .description('Take accessibility tree snapshot')
  .addOption(profileOption)
  .option('--json', 'Output as JSON')
  .action(snapshot);

// Take screenshot
program
  .command('screenshot')
  .description('Take screenshot of the current tab')
  .addOption(profileOption)
  .argument('<output>', 'Output file path')
  .action((output: string, options: Record<string, any>) => {
    screenshot({ ...options, output, profile: options.profile || process.env.DV_PROFILE! });
  });

// Console
program
  .command('console')
  .description('List console messages from the current tab')
  .addOption(profileOption)
  .option('-t, --type <type>', 'Filter by message type (log, warn, error, info, debug)')
  .option('-f, --filter <pattern>', 'Filter messages by pattern')
  .option('--json', 'Output as JSON')
  .option('--tab-id <id>', 'Target specific tab by ID')
  .action(consoleCommand);

// Reload
program
  .command('reload')
  .description('Reload the current tab')
  .addOption(profileOption)
  .action(async (options: Record<string, any>) => {
    const { CDPClient } = await import('./cdp.js');
    const { getPortFromProfile } = await import('./utils.js');
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
      await client.connect();
      await client.enablePage();
      await client.reloadAndWait(2000);
      console.log(chalk.green('Tab reloaded'));
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    } finally {
      await client.close();
    }
  });

// Click
program
  .command('click')
  .description('Click element by selector')
  .addOption(profileOption)
  .argument('<selector>', 'CSS selector')
  .action((selector: string, options: Record<string, any>) => {
    click({ ...options, selector, profile: options.profile || process.env.DV_PROFILE! });
  });

// Fill
program
  .command('fill')
  .description('Fill input with value (clears existing value)')
  .addOption(profileOption)
  .argument('<selector>', 'CSS selector')
  .argument('<value>', 'Value to fill')
  .action((selector: string, value: string, options: Record<string, any>) => {
    fill({ ...options, selector, value, profile: options.profile || process.env.DV_PROFILE! });
  });

// Type
program
  .command('type')
  .description('Type text into element (appends to existing)')
  .addOption(profileOption)
  .argument('<selector>', 'CSS selector')
  .argument('<text>', 'Text to type')
  .action((selector: string, text: string, options: Record<string, any>) => {
    type({ ...options, selector, text, profile: options.profile || process.env.DV_PROFILE! });
  });

// Key
program
  .command('key')
  .description('Press a key')
  .addOption(profileOption)
  .requiredOption('-k, --key <key>', 'Key to press (e.g., Enter, Escape, Tab)')
  .action(key);

// Tabs
program
  .command('tabs')
  .description('List all open tabs')
  .addOption(profileOption)
  .option('--json', 'Output as JSON')
  .action(tabs);

// Select
program
  .command('select')
  .description('Select a tab by ID or index')
  .addOption(profileOption)
  .option('--tab-id <id>', 'Tab ID')
  .option('-i, --index <index>', 'Tab index (1-based)', parseInt)
  .action(select);

// New tab
program
  .command('new')
  .description('Open a new tab with URL')
  .addOption(profileOption)
  .argument('<url>', 'URL to open')
  .option('--json', 'Output as JSON')
  .action((url: string, options: Record<string, any>) => {
    newPage({ ...options, url, profile: options.profile || process.env.DV_PROFILE! });
  });

// Close tab
program
  .command('close')
  .description('Close a tab')
  .addOption(profileOption)
  .argument('<tab-id>', 'Tab ID to close')
  .action((tabId: string, options: Record<string, any>) => {
    close({ ...options, tabId, profile: options.profile || process.env.DV_PROFILE! });
  });

// Resize
program
  .command('resize')
  .description('Resize viewport')
  .addOption(profileOption)
  .argument('<width>', 'Viewport width', parseInt)
  .argument('<height>', 'Viewport height', parseInt)
  .action((width: number, height: number, options: Record<string, any>) => {
    resize({ ...options, width, height, profile: options.profile || process.env.DV_PROFILE! });
  });

// Monitor
program
  .command('monitor')
  .description('Monitor console messages in real-time')
  .addOption(profileOption)
  .requiredOption('-t, --types <types>', 'Comma-separated message types (error,warn,log)')
  .action(monitor);

// Profiles
const profilesCmd = program
  .command('profiles')
  .description('List available profiles')
  .action(() => {
    const profileList = listProfiles();
    console.log(chalk.blue('Available profiles:\n'));
    profileList.forEach(p => {
      console.log(chalk.bold(`  ${p.name}`));
      console.log(chalk.gray(`    Port: ${p.port}`));
      console.log();
    });
  });

if (process.env.DV_BIN_NAME) {
  (profilesCmd as unknown as { _hidden: boolean })._hidden = true;
}

// Query command — shadow DOM piercing via >>>
program
  .command('query')
  .description('Query element content (supports shadow DOM piercing with >>>)')
  .addOption(profileOption)
  .argument('<selector>', 'CSS selector (use >>> to pierce shadow roots, e.g. "my-comp >>> .btn")')
  .option('--html', 'Get outerHTML (default)')
  .option('--text', 'Get textContent')
  .option('--attr <name>', 'Get attribute value')
  .option('--count', 'Count matching elements')
  .option('--exists', 'Check if element exists')
  .option('--json', 'Output as JSON')
  .action((selector: string, options: Record<string, any>) => {
    query({ ...options, selector, profile: options.profile || process.env.DV_PROFILE! });
  });

// Network commands
program
  .command('network')
  .description('List network requests')
  .addOption(profileOption)
  .option('-f, --filter <pattern>', 'Filter by URL pattern')
  .option('--json', 'Output as JSON')
  .action(network);

program
  .command('intercept')
  .description('Intercept network requests')
  .addOption(profileOption)
  .requiredOption('-u, --url <url>', 'URL pattern to intercept')
  .requiredOption('-a, --action <action>', 'Action: block or mock')
  .option('-r, --response <response>', 'Mock response body')
  .action(intercept);

program
  .command('request')
  .description('Get request details')
  .addOption(profileOption)
  .requiredOption('-i, --id <id>', 'Request ID')
  .option('--body', 'Include response body')
  .option('--json', 'Output as JSON')
  .action(request);

program
  .command('clear-cache')
  .description('Clear browser cache')
  .addOption(profileOption)
  .action(clearCache);

// DOM commands
program
  .command('inspect')
  .description('Inspect element details')
  .addOption(profileOption)
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .option('--json', 'Output as JSON')
  .action(inspect);

program
  .command('query-all')
  .description('Query all matching elements')
  .addOption(profileOption)
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .option('--json', 'Output as JSON')
  .action(queryAll);

program
  .command('get-text')
  .description('Get element text content')
  .addOption(profileOption)
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .action(getText);

program
  .command('get-html')
  .description('Get element HTML')
  .addOption(profileOption)
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .action(getHtml);

program
  .command('set-text')
  .description('Set element text content')
  .addOption(profileOption)
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .requiredOption('-v, --value <value>', 'Text value')
  .action(setText);

program
  .command('set-html')
  .description('Set element HTML')
  .addOption(profileOption)
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .requiredOption('-v, --value <value>', 'HTML value')
  .action(setHtml);

program
  .command('set-attribute')
  .description('Set element attribute')
  .addOption(profileOption)
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .requiredOption('-a, --attr <attr>', 'Attribute name')
  .requiredOption('-v, --value <value>', 'Attribute value')
  .action(setAttribute);

// Emulation commands
program
  .command('emulate')
  .description('Emulate device')
  .addOption(profileOption)
  .requiredOption('-d, --device <device>', 'Device name (e.g., iphone-13, pixel-5, ipad-pro)')
  .action(emulate);

program
  .command('location')
  .description('Set geolocation')
  .addOption(profileOption)
  .argument('<lat>', 'Latitude', parseFloat)
  .argument('<lng>', 'Longitude', parseFloat)
  .option('--accuracy <accuracy>', 'Accuracy in meters', parseFloat)
  .action((lat: number, lng: number, options: Record<string, any>) => {
    location({ ...options, lat, lng, profile: options.profile || process.env.DV_PROFILE! });
  });

program
  .command('user-agent')
  .description('Set user agent')
  .addOption(profileOption)
  .requiredOption('--ua <ua>', 'User agent string')
  .action(userAgent);

program
  .command('timezone')
  .description('Set timezone')
  .addOption(profileOption)
  .requiredOption('--tz <tz>', 'Timezone ID (e.g., America/New_York)')
  .action(timezone);

program
  .command('throttle')
  .description('Throttle network')
  .addOption(profileOption)
  .option('--offline', 'Go offline')
  .option('--slow-3g', 'Slow 3G')
  .option('--fast-3g', 'Fast 3G')
  .action(throttle);

// Storage commands
program
  .command('cookies')
  .description('List cookies')
  .addOption(profileOption)
  .option('--domain <domain>', 'Filter by domain')
  .option('--json', 'Output as JSON')
  .action(cookies);

program
  .command('cookies-clear')
  .description('Clear cookies')
  .addOption(profileOption)
  .option('--domain <domain>', 'Clear cookies for domain')
  .action(cookiesClear);

program
  .command('storage-clear')
  .description('Clear storage')
  .addOption(profileOption)
  .requiredOption('-t, --type <type>', 'Storage type: local, session, or all')
  .action(storageClear);

program
  .command('local-storage')
  .description('List localStorage items')
  .addOption(profileOption)
  .option('-k, --key <key>', 'Filter by key')
  .option('--json', 'Output as JSON')
  .action(localStorage);

program
  .command('session-storage')
  .description('List sessionStorage items')
  .addOption(profileOption)
  .option('-k, --key <key>', 'Filter by key')
  .option('--json', 'Output as JSON')
  .action(sessionStorage);

program.parse();