import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import { getPortFromProfile } from '../utils.js';

const execAsync = promisify(exec);

export interface StopOptions {
  profile: string;
}

export async function stop(options: StopOptions) {
  const port = getPortFromProfile(options.profile);

  try {
    let command: string;

    if (process.platform === 'win32') {
      // Windows: Find and kill Chrome process by port
      command = `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %a`;
    } else if (process.platform === 'darwin') {
      // macOS: Kill Chrome process using lsof
      command = `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`;
    } else {
      // Linux: Kill Chrome process using lsof
      command = `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`;
    }

    await execAsync(command);
    console.log(chalk.green.bold(`✓ Chrome stopped on port ${port}`));
    console.log(chalk.gray(`Port ${port} is now available`));
  } catch (error) {
    // No process found or already stopped
    console.log(chalk.yellow(`Chrome is not running on port ${port}`));
  }
}
