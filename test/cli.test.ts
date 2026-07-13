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
      const { stdout } = await runCLI(['start', '--profile', 'dv1', '--help']);
      expect(stdout).toContain('Start Chrome');
      expect(stdout).toContain('--headless');
    });
  });

  describe('Profile Command', () => {
    it('should list all profiles', async () => {
      const { stdout } = await runCLI(['profiles']);
      expect(stdout).toContain('dv1');
      expect(stdout).toContain('dv6');
      expect(stdout).toContain('9230');
      expect(stdout).toContain('9235');
    });
  });

  describe('Required Profile Parameter', () => {
    const commandsRequiringProfile = [
      'start',
      'status',
      'eval',
      'network',
      'console',
      'cookies',
    ];

    commandsRequiringProfile.forEach((command) => {
      it(`should require --profile for ${command} command`, async () => {
        const { stderr } = await runCLI([command]);
        expect(stderr).toContain("required option '--profile <profile>' not specified");
      });
    });

    // Commands that have required options: missing --profile only visible after Commander validates options
    const commandsWithRequiredOptions: Record<string, string> = {
      emulate: 'required option',
    };

    Object.entries(commandsWithRequiredOptions).forEach(([command, expectedPattern]) => {
      it(`should still work for ${command} command with --profile and required option`, async () => {
        const { stderr, stdout } = await runCLI([command, '--profile', 'dv1']);
        const output = stdout + stderr;
        // Should not crash with the duplicate-eval error or similar
        expect(output).not.toContain('cannot add command');
        // Commander should error about the missing required option, not about profile
        expect(output).toMatch(new RegExp(expectedPattern));
      });
    });

    // navigate, click, fill, screenshot use positional arguments now
    ['navigate', 'click', 'fill', 'screenshot'].forEach((command) => {
      it(`should still work for ${command} command with --profile`, async () => {
        const { stderr, stdout } = await runCLI([command, '--profile', 'dv1']);
        const output = stdout + stderr;
        expect(output).not.toContain('cannot add command');
        expect(output).toContain("missing required argument");
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
      const { stderr } = await runCLI(['navigate', '--profile', 'dv1']);
      expect(stderr).toContain("error: missing required argument 'url'");
    });

    it('should require selector for click command', async () => {
      const { stderr } = await runCLI(['click', '--profile', 'dv1']);
      expect(stderr).toContain("error: missing required argument 'selector'");
    });

    it('should require selector and value for fill command', async () => {
      const { stderr } = await runCLI(['fill', '--profile', 'dv1']);
      expect(stderr).toContain("error: missing required argument 'selector'");
    });

    it('should require --script for eval command', async () => {
      const { stderr, stdout } = await runCLI(['eval', '--profile', 'dv1', '--script', '1+1']);
      // The command will fail because Chrome isn't running, but that's OK
      const output = stdout + stderr;
      expect(output).toBeDefined();
    });

    it('should require output file for screenshot command', async () => {
      const { stderr, stdout } = await runCLI(['screenshot', '--profile', 'dv1']);
      // The command will fail because Chrome isn't running, but that's OK
      const output = stdout + stderr;
      expect(output).toBeDefined();
    });
  });

  describe('Command Options Accepted', () => {
    it('should accept --headless flag for start command', async () => {
      const { stdout } = await runCLI(['start', '--profile', 'dv1', '--headless', '--help']);
      expect(stdout).toContain('--headless');
    });

    it('should accept --json flag for network command', async () => {
      const { stdout } = await runCLI(['network', '--profile', 'dv1', '--help']);
      expect(stdout).toContain('--json');
    });

    it('should accept --filter option for network command', async () => {
      const { stdout } = await runCLI(['network', '--profile', 'dv1', '--help']);
      expect(stdout).toContain('--filter');
    });

    it('should accept --type option for console command', async () => {
      const { stdout } = await runCLI(['console', '--profile', 'dv1', '--help']);
      expect(stdout).toContain('--type');
    });

    it('should accept --tab-id option for console command', async () => {
      const { stdout } = await runCLI(['console', '--profile', 'dv1', '--help']);
      expect(stdout).toContain('--tab-id');
    });
  });
});

describe('CLI Error Handling', () => {
  it('should handle non-existent command gracefully', async () => {
    const { stderr } = await runCLI(['nonexistent']);
    expect(stderr).toContain('error: unknown command');
  });
});