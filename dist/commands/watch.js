import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
export async function watch(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect();
        if (options.install || options.continuous) {
            console.log(chalk.blue('Installing MutationObserver on the page...'));
            await client.installMutationObserver();
            console.log(chalk.green('MutationObserver installed'));
        }
        if (options.read || options.continuous) {
            const mutations = await client.readMutations();
            if (mutations.length === 0) {
                console.log(chalk.gray('No mutations recorded'));
            }
            else {
                console.log(chalk.blue(`DOM Mutations (${mutations.length}):\n`));
                for (const m of mutations) {
                    const icon = m.type === 'childList' ? '📦' : m.type === 'attributes' ? '🎨' : '📝';
                    console.log(`  ${icon} ${chalk.cyan(m.type)} on ${m.target}`);
                    if (m.added > 0)
                        console.log(`      Added: ${m.added} node(s)`);
                    if (m.removed > 0)
                        console.log(`      Removed: ${m.removed} node(s)`);
                    if (m.attr)
                        console.log(`      Attribute: ${m.attr}`);
                    console.log(chalk.gray(`      ${new Date(m.time).toLocaleTimeString()}`));
                    console.log();
                }
            }
        }
        if (!options.install && !options.read && !options.continuous) {
            console.error(chalk.red('Specify an action: --install, --read, or --continuous'));
            process.exit(1);
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
//# sourceMappingURL=watch.js.map