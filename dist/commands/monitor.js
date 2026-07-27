import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
// Map user-friendly short type names to CDP Console level values
const TYPE_ALIASES = {
    warn: 'warning',
    error: 'error',
    log: 'log',
    info: 'info',
    debug: 'debug',
};
export async function monitor(options) {
    const types = options.types.split(',').map(t => t.trim());
    const cdpTypes = types.map(t => TYPE_ALIASES[t] || t);
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect();
        await client.enableConsole();
        console.log(chalk.blue(`Monitoring console messages (types: ${types.join(', ')})...`));
        console.log(chalk.gray('Press Ctrl+C to stop\n'));
        // Keep the connection alive and listen for console messages
        const checkMessages = async () => {
            // Use atomic swap to avoid losing messages between read and clear
            const messages = await client.getAndClearConsoleMessages();
            const filtered = messages.filter(m => cdpTypes.includes(m.type));
            filtered.forEach(msg => {
                const typeColors = {
                    error: chalk.red,
                    warning: chalk.yellow,
                    log: chalk.white,
                    info: chalk.blue,
                    debug: chalk.gray,
                };
                const color = typeColors[msg.type] || chalk.white;
                console.log(color(`[${msg.type}] ${msg.text}`));
                if (msg.url) {
                    console.log(chalk.gray(`  at ${msg.url}:${msg.line}:${msg.column}`));
                }
            });
            // Check again in 100ms
            setTimeout(checkMessages, 100);
        };
        checkMessages();
        // Keep the process running
        process.on('SIGINT', () => {
            console.log(chalk.blue('\nStopping monitor...'));
            client.close();
            process.exit(0);
        });
    }
    catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
        process.exit(1);
    }
}
//# sourceMappingURL=monitor.js.map