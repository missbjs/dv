import { spawn } from 'child_process';
import chalk from 'chalk';
export async function batch(options) {
    const bin = options.bin ?? dvProfileBin(options.profile);
    const delay = options.delay ?? 0;
    if (options.commands.length === 0) {
        console.log(chalk.yellow('No commands to execute.'));
        return;
    }
    let passed = 0;
    let failed = 0;
    for (let i = 0; i < options.commands.length; i++) {
        const cmd = options.commands[i];
        console.log(chalk.blue(`\n[${i + 1}/${options.commands.length}] ${bin} ${cmd}`));
        try {
            await execCommand(bin, cmd);
            passed++;
            console.log(chalk.green(`  ✓ OK`));
        }
        catch (error) {
            failed++;
            console.log(chalk.red(`  ✗ FAILED (exit ${error.exitCode ?? error.code ?? 1})`));
            if (error.stdout)
                console.log(chalk.gray(`  stdout: ${error.stdout}`));
            if (error.stderr)
                console.log(chalk.gray(`  stderr: ${error.stderr}`));
            if (options.bail) {
                console.log(chalk.red(`\nBailing after failure on command ${i + 1}`));
                break;
            }
        }
        if (delay > 0 && i < options.commands.length - 1) {
            await sleep(delay);
        }
    }
    console.log(chalk.blue(`\n─`.repeat(30)));
    if (failed === 0) {
        console.log(chalk.green(`All ${passed} commands passed`));
    }
    else {
        console.log(chalk.yellow(`${passed} passed, ${failed} failed`));
        if (failed > 0)
            process.exit(1);
    }
}
function execCommand(bin, cmd) {
    return new Promise((resolve, reject) => {
        // Split cmd into bin args — we need to pass the command and its args
        // The bin is "dv1" through "dv6", and we pass additional args
        const args = cmd.split(/\s+/).filter(Boolean);
        if (args.length === 0) {
            resolve();
            return;
        }
        const proc = spawn(bin, args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true,
        });
        let stdout = '';
        let stderr = '';
        proc.stdout?.on('data', (data) => {
            stdout += data.toString();
            // Stream output to console for visibility
            process.stdout.write(data);
        });
        proc.stderr?.on('data', (data) => {
            stderr += data.toString();
            process.stderr.write(data);
        });
        proc.on('close', (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                const err = new Error(`Command failed with exit code ${code}`);
                err.exitCode = code;
                err.stdout = stdout.trim();
                err.stderr = stderr.trim();
                reject(err);
            }
        });
        proc.on('error', (err) => {
            reject(err);
        });
    });
}
/** Map profile name to dv binary */
function dvProfileBin(profile) {
    // dv1 → dv1, dv2 → dv2, etc.
    return profile.startsWith('dv') ? profile : `dv${profile}`;
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//# sourceMappingURL=batch.js.map