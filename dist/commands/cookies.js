import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { wantsStructured, renderStructured } from '../output.js';
import { getPortFromProfile } from '../utils.js';
export async function cookies(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect();
        console.log(chalk.blue('Getting cookies...'));
        const result = await client.getCookies(options.domain ? [options.domain] : undefined);
        if (wantsStructured(options)) {
            console.log(renderStructured(result.cookies, options));
        }
        else {
            if (!result.cookies || result.cookies.length === 0) {
                console.log(chalk.gray('No cookies found'));
                return;
            }
            console.log(chalk.green(`\n✓ Found ${result.cookies.length} cookie(s):\n`));
            result.cookies.forEach((cookie, index) => {
                console.log(chalk.white(`${index + 1}. ${cookie.name}`));
                console.log(chalk.gray(`   Domain: ${cookie.domain}`));
                console.log(chalk.gray(`   Value: ${cookie.value}`));
                console.log(chalk.gray(`   Path: ${cookie.path}`));
                if (cookie.expires) {
                    console.log(chalk.gray(`   Expires: ${new Date(cookie.expires * 1000).toISOString()}`));
                }
            });
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
//# sourceMappingURL=cookies.js.map