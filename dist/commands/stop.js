import { spawn, execFile } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';
const execFileAsync = promisify(execFile);
/** Find PIDs holding a TCP listener on the given port (Windows: netstat; POSIX: lsof). */
async function findPidsByPort(port) {
    if (process.platform === 'win32') {
        const { stdout } = await execFileAsync('netstat', ['-ano', '-p', 'tcp']);
        const pids = new Set();
        for (const line of stdout.split(/\r?\n/)) {
            // Lines look like:  TCP    0.0.0.0:9230    0.0.0.0:0    LISTENING    1234
            const match = line.match(/:(\d+)\s+\S+\s+(?:LISTENING|ESTABLISHED|TIME_WAIT)\s+(\d+)\s*$/i);
            if (match && Number(match[1]) === port) {
                const pid = Number(match[2]);
                if (pid !== 0)
                    pids.add(pid);
            }
        }
        return [...pids];
    }
    // macOS / Linux
    const { stdout } = await execFileAsync('lsof', ['-ti', `:${port}`]);
    return stdout
        .split(/\r?\n/)
        .map((line) => Number(line.trim()))
        .filter((pid) => Number.isFinite(pid) && pid > 0);
}
export async function stop(options) {
    const port = getPortFromProfile(options.profile);
    try {
        const pids = await findPidsByPort(port);
        if (pids.length === 0) {
            console.log(chalk.yellow(`Chrome is not running on port ${port}`));
            return;
        }
        if (process.platform === 'win32') {
            for (const pid of pids) {
                await new Promise((resolve) => {
                    const proc = spawn('taskkill', ['/F', '/PID', String(pid)], { stdio: 'ignore' });
                    proc.on('close', () => resolve());
                    proc.on('error', () => resolve());
                });
            }
        }
        else {
            await new Promise((resolve) => {
                const proc = spawn('kill', ['-9', ...pids.map(String)], { stdio: 'ignore' });
                proc.on('close', () => resolve());
                proc.on('error', () => resolve());
            });
        }
        console.log(chalk.green.bold(`✓ Chrome stopped on port ${port}`));
        console.log(chalk.gray(`Port ${port} is now available`));
    }
    catch (error) {
        // E.g. lsof/netstat not found, or no process matched
        console.log(chalk.yellow(`Chrome is not running on port ${port}`));
    }
}
//# sourceMappingURL=stop.js.map