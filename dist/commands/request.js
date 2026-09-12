import { CDPClient } from '../cdp.js';
import { targetTab } from '../tab.js';
import chalk from 'chalk';
import { wantsStructured, renderStructured } from '../output.js';
import { getPortFromProfile } from '../utils.js';
export async function request(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect(targetTab(options));
        const requests = await client.getNetworkRequests();
        const req = requests.find(r => r.requestId === options.id);
        if (!req) {
            console.error(chalk.red(`Request not found: ${options.id}`));
            process.exit(1);
        }
        if (wantsStructured(options)) {
            console.log(renderStructured(req, options));
        }
        else {
            console.log(chalk.bold(`\n${req.method} ${req.url}`));
            console.log(chalk.gray(`Type: ${req.type}`));
            if (req.status) {
                console.log(chalk.gray(`Status: ${req.status}`));
            }
            if (req.responseHeaders) {
                console.log(chalk.gray('\nHeaders:'));
                Object.entries(req.responseHeaders).forEach(([key, value]) => {
                    console.log(chalk.gray(`  ${key}: ${value}`));
                });
            }
        }
        if (options.body) {
            try {
                const response = await client.getResponseBody(options.id);
                console.log(chalk.blue('\nResponse Body:'));
                console.log(response.body);
            }
            catch (error) {
                console.log(chalk.yellow('Response body not available'));
            }
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
//# sourceMappingURL=request.js.map