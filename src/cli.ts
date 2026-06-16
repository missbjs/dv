#!/usr/bin/env node

import { Command } from 'commander';
import { start } from './commands/start.js';
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
import { pages } from './commands/pages.js';
import { select } from './commands/select.js';
import { newPage } from './commands/new.js';
import { close } from './commands/close.js';
import { resize } from './commands/resize.js';
import { monitor } from './commands/monitor.js';
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

program
  .name('dv')
  .description('Chrome DevTools Protocol CLI wrapper')
  .version('1.0.0');

// Start Chrome
program
  .command('start')
  .description('Start Chrome with remote debugging')
  .option('-p, --port <port>', 'Remote debugging port', parseInt)
  .option('--profile <profile>', 'Profile name (profile-qmdj-1 through profile-qmdj-6)')
  .option('--headed', 'Run in headed mode (not headless)')
  .action(start);

// Status
program
  .command('status')
  .description('Check if Chrome is running and show open pages')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .action(status);

// Navigate
program
  .command('navigate')
  .description('Navigate to URL')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-u, --url <url>', 'URL to navigate to')
  .option('--headed', 'Run in headed mode')
  .action(navigate);

// Evaluate JavaScript
program
  .command('eval')
  .description('Evaluate JavaScript in the page')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .option('-s, --script <script>', 'JavaScript expression to evaluate')
  .option('-f, --file <file>', 'JavaScript file to evaluate')
  .option('--json', 'Output as JSON')
  .action(evalCommand);

// Take snapshot
program
  .command('snapshot')
  .description('Take accessibility tree snapshot')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .option('--json', 'Output as JSON')
  .action(snapshot);

// Take screenshot
program
  .command('screenshot')
  .description('Take screenshot of the page')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-o, --output <file>', 'Output file path')
  .action(screenshot);

// Console
program
  .command('console')
  .description('List console messages')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .option('-t, --type <type>', 'Filter by message type (log, warn, error, info, debug)')
  .option('-f, --filter <pattern>', 'Filter messages by pattern')
  .option('--json', 'Output as JSON')
  .option('--clear', 'Clear console after listing')
  .action(consoleCommand);

// Click
program
  .command('click')
  .description('Click element by selector')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .action(click);

// Fill
program
  .command('fill')
  .description('Fill input with value (clears existing value)')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .requiredOption('-v, --value <value>', 'Value to fill')
  .action(fill);

// Type
program
  .command('type')
  .description('Type text into element (appends to existing)')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .requiredOption('-t, --text <text>', 'Text to type')
  .action(type);

// Key
program
  .command('key')
  .description('Press a key')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-k, --key <key>', 'Key to press (e.g., Enter, Escape, Tab)')
  .action(key);

// Pages
program
  .command('pages')
  .description('List all open pages')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .option('--json', 'Output as JSON')
  .action(pages);

// Select
program
  .command('select')
  .description('Select page by URL, ID, or index')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .option('-u, --url <url>', 'URL pattern to match')
  .option('--page-id <id>', 'Page ID')
  .option('-i, --index <index>', 'Page index (1-based)', parseInt)
  .action(select);

// New
program
  .command('new')
  .description('Open new page')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-u, --url <url>', 'URL to open')
  .option('--json', 'Output as JSON')
  .action(newPage);

// Close
program
  .command('close')
  .description('Close page')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .option('--page-id <id>', 'Page ID (defaults to current page)')
  .action(close);

// Resize
program
  .command('resize')
  .description('Resize viewport')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-w, --width <width>', 'Viewport width', parseInt)
  .requiredOption('-h, --height <height>', 'Viewport height', parseInt)
  .action(resize);

// Monitor
program
  .command('monitor')
  .description('Monitor console messages in real-time')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-t, --types <types>', 'Comma-separated message types (error,warn,log)')
  .action(monitor);

// Profiles
program
  .command('profiles')
  .description('List available profiles')
  .action(() => {
    const profileList = listProfiles();
    console.log(chalk.blue('Available profiles:\n'));
    profileList.forEach(p => {
      console.log(chalk.bold(`  ${p.name}`));
      console.log(chalk.gray(`    Port: ${p.port}`));
      console.log(chalk.gray(`    Purpose: ${p.purpose}`));
      console.log();
    });
  });

// Network commands
program
  .command('network')
  .description('List network requests')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .option('-f, --filter <pattern>', 'Filter by URL pattern')
  .option('--json', 'Output as JSON')
  .action(network);

program
  .command('intercept')
  .description('Intercept network requests')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-u, --url <url>', 'URL pattern to intercept')
  .requiredOption('-a, --action <action>', 'Action: block or mock')
  .option('-r, --response <response>', 'Mock response body')
  .action(intercept);

program
  .command('request')
  .description('Get request details')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-i, --id <id>', 'Request ID')
  .option('--body', 'Include response body')
  .option('--json', 'Output as JSON')
  .action(request);

program
  .command('clear-cache')
  .description('Clear browser cache')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .action(clearCache);

// DOM commands
program
  .command('inspect')
  .description('Inspect element details')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .option('--json', 'Output as JSON')
  .action(inspect);

program
  .command('query-all')
  .description('Query all matching elements')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .option('--json', 'Output as JSON')
  .action(queryAll);

program
  .command('get-text')
  .description('Get element text content')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .action(getText);

program
  .command('get-html')
  .description('Get element HTML')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .action(getHtml);

program
  .command('set-text')
  .description('Set element text content')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .requiredOption('-v, --value <value>', 'Text value')
  .action(setText);

program
  .command('set-html')
  .description('Set element HTML')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .requiredOption('-v, --value <value>', 'HTML value')
  .action(setHtml);

program
  .command('set-attribute')
  .description('Set element attribute')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-s, --selector <selector>', 'CSS selector')
  .requiredOption('-a, --attr <attr>', 'Attribute name')
  .requiredOption('-v, --value <value>', 'Attribute value')
  .action(setAttribute);

// Emulation commands
program
  .command('emulate')
  .description('Emulate device')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-d, --device <device>', 'Device name (e.g., iphone-13, pixel-5, ipad-pro)')
  .action(emulate);

program
  .command('location')
  .description('Set geolocation')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('--lat <lat>', 'Latitude', parseFloat)
  .requiredOption('--lng <lng>', 'Longitude', parseFloat)
  .option('--accuracy <accuracy>', 'Accuracy in meters', parseFloat)
  .action(location);

program
  .command('user-agent')
  .description('Set user agent')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('--ua <ua>', 'User agent string')
  .action(userAgent);

program
  .command('timezone')
  .description('Set timezone')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('--tz <tz>', 'Timezone ID (e.g., America/New_York)')
  .action(timezone);

program
  .command('throttle')
  .description('Throttle network')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .option('--offline', 'Go offline')
  .option('--slow-3g', 'Slow 3G')
  .option('--fast-3g', 'Fast 3G')
  .action(throttle);

// Storage commands
program
  .command('cookies')
  .description('List cookies')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .option('--domain <domain>', 'Filter by domain')
  .option('--json', 'Output as JSON')
  .action(cookies);

program
  .command('cookies-clear')
  .description('Clear cookies')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .option('--domain <domain>', 'Clear cookies for domain')
  .action(cookiesClear);

program
  .command('storage-clear')
  .description('Clear storage')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .requiredOption('-t, --type <type>', 'Storage type: local, session, or all')
  .action(storageClear);

program
  .command('local-storage')
  .description('List localStorage items')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .option('-k, --key <key>', 'Filter by key')
  .option('--json', 'Output as JSON')
  .action(localStorage);

program
  .command('session-storage')
  .description('List sessionStorage items')
  .requiredOption('-p, --port <port>', 'Remote debugging port', parseInt)
  .option('-k, --key <key>', 'Filter by key')
  .option('--json', 'Output as JSON')
  .action(sessionStorage);

program.parse();
