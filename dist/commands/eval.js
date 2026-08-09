import { CDPClient } from '../cdp.js';
import chalk from 'chalk';
import { wantsStructured, renderStructured } from '../output.js';
import { promises as fs } from 'fs';
import { getPortFromProfile } from '../utils.js';
export async function evalCommand(options) {
    const client = new CDPClient(getPortFromProfile(options.profile));
    try {
        await client.connect();
        await client.enableRuntime();
        let expression = '';
        if (options.file) {
            expression = await fs.readFile(options.file, 'utf-8');
        }
        else if (options.script) {
            expression = options.script;
        }
        else {
            console.error(chalk.red('Either --script or --file is required'));
            process.exit(1);
        }
        const result = await client.evaluate(expression);
        if (wantsStructured(options)) {
            console.log(renderStructured(result, options));
        }
        else {
            if (result.result?.value !== undefined) {
                console.log(result.result.value);
            }
            else {
                console.log(chalk.gray('undefined'));
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
//# sourceMappingURL=eval.js.map