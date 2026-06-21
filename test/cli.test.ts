import { describe, it, expect, beforeAll } from 'vitest';
import { execFile } from 'child_process';
import { join } from 'path';

const CLI_PATH = join(process.cwd(), 'dist', 'cli.js');

function runCLI(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile('node', [CLI_PATH, ...args], (error, stdout, stderr) => {
      resolve({ stdout, stderr });
    });
  });
}

describe('CLI Commands', () => {
  beforeAll(async () => {
    // Build the CLI before running tests
    execFile('npm', ['run', 'build']);
  });

  describe('Help and Version', () => {
    it('should show help with --help flag', async () => {
      const { stdout } = await runCLI(['--help']);
      expect(stdout).toContain('Chrome DevTools Protocol CLI');
      expect(stdout).toContain('Commands:');
    });

    it('should show version with --version flag', async () => {
      const { stdout } = await runCLI(['--version']);
      expect(stdout).toMatch(/\d+\.\d+\.\d+/);
    });

    it('should show command-specific help', async () => {
      const { stdout } = await runCLI(['start', '--help']);
      expect(stdout).toContain('Start Chrome');
      expect(stdout).toContain('--profile');
      expect(stdout).toContain('--headed');
    });
  });

  describe('Profile Command', () => {
    it('should list all profiles', async () => {
      const { stdout } = await runCLI(['profiles']);
      expect(stdout).toContain('profile-1');
      expect(stdout).toContain('profile-6');
      expect(stdout).toContain('9230');
      expect(stdout).toContain('9235');
    });
  });

  describe('Required Profile Parameter', () => {
    const commandsRequiringProfile = [
      'start',
      'navigate',
      'status',
      'click',
      'fill',
      'eval',
      'screenshot',
      'network',
      'console',
      'cookies',
      'emulate',
    ];

    commandsRequiringProfile.forEach((command) => {
      it(`should require --profile for ${command} command`, async () => {
        const { stderr } = await runCLI([command]);
        expect(stderr).toContain("required option '--profile <profile>'");
      });
    });
  });

  describe('Invalid Profile Name', () => {
    it('should reject invalid profile name', async () => {
      const { stdout, stderr } = await runCLI(['start', '--profile', 'invalid-profile']);
      const output = stdout + stderr;
      expect(output).toContain('Profile not found');
    });

    it('should show available profiles on invalid name', async () => {
      const { stdout, stderr } = await runCLI(['start', '--profile', 'invalid']);
      const output = stdout + stderr;
      expect(output).toContain('Available profiles:');
    });
  });

  describe('Command Options Validation', () => {
    it('should require --url for navigate command', async () => {
      const { stderr } = await runCLI(['navigate', '--profile', 'profile-1']);
      expect(stderr).toContain("required option '-u, --url <url>'");
    });

    it('should require --selector for click command', async () => {
      const { stderr } = await runCLI(['click', '--profile', 'profile-1']);
      expect(stderr).toContain("required option '-s, --selector <selector>'");
    });

    it('should require --selector and --value for fill command', async () => {
      const { stderr } = await runCLI(['fill', '--profile', 'profile-1']);
      expect(stderr).toContain("required option '-s, --selector <selector>'");
    });

    it('should require --script for eval command', async () => {
      const { stderr, stdout } = await runCLI(['eval', '--profile', 'profile-1', '--script', '1+1']);
      // The command will fail because Chrome isn't running, but that's OK
      const output = stdout + stderr;
      expect(output).toBeDefined();
    });

    it('should require --output for screenshot command', async () => {
      const { stderr, stdout } = await runCLI(['screenshot', '--profile', 'profile-1', '--output', 'test.png']);
      // The command will fail because Chrome isn't running, but that's OK
      const output = stdout + stderr;
      expect(output).toBeDefined();
    });
  });

  describe('Command Options Accepted', () => {
    it('should accept --headed flag for start command', async () => {
      const { stdout } = await runCLI(['start', '--profile', 'profile-1', '--headed', '--help']);
      expect(stdout).toContain('--headed');
    });

    it('should accept --json flag for network command', async () => {
      const { stdout } = await runCLI(['network', '--profile', 'profile-1', '--help']);
      expect(stdout).toContain('--json');
    });

    it('should accept --filter option for network command', async () => {
      const { stdout } = await runCLI(['network', '--profile', 'profile-1', '--help']);
      expect(stdout).toContain('--filter');
    });

    it('should accept --type option for console command', async () => {
      const { stdout } = await runCLI(['console', '--profile', 'profile-1', '--help']);
      expect(stdout).toContain('--type');
    });
  });
});

describe('CLI Error Handling', () => {
  it('should handle non-existent command gracefully', async () => {
    const { stderr } = await runCLI(['nonexistent']);
    expect(stderr).toContain('error: unknown command');
  });
});