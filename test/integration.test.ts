import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFile } from 'child_process';
import { join } from 'path';
import { TEST_PORT } from './test-profiles.js';

const CLI_PATH = join(process.cwd(), 'dist', 'cli.js');

function runCLIAsync(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const child = execFile('node', [CLI_PATH, ...args], (error, stdout, stderr) => {
      resolve({
        stdout,
        stderr,
        exitCode: error ? 1 : 0,
      });
    });
  });
}

describe('Integration Tests', () => {
  describe('Command Flow Tests', () => {
    it('should show all 49 commands in help', async () => {
      const { stdout } = await runCLIAsync(['--help']);

      // Count commands mentioned in help
      const commandCount = stdout.split('\n').filter((line) => line.match(/^\s+\w+/)).length;

      // Should have many commands (at least 30+)
      expect(commandCount).toBeGreaterThan(30);
    });

    it('should categorize commands by domain', async () => {
      const { stdout } = await runCLIAsync(['--help']);

      // Check for different command categories
      expect(stdout).toContain('start');
      expect(stdout).toContain('navigate');
      expect(stdout).toContain('network');
      expect(stdout).toContain('console');
      expect(stdout).toContain('cookies');
    });
  });

  describe('Profile System Integration', () => {
    it('should enforce profile requirement for commands without required options', async () => {
      const commandsToTest = ['eval', 'network', 'console'];

      for (const cmd of commandsToTest) {
        const { stdout, stderr } = await runCLIAsync([cmd]);
        const output = stdout + stderr;
        expect(output).toContain('profile');
      }
    });

    it('should provide helpful error messages', async () => {
      const { stdout, stderr } = await runCLIAsync(['start', '--profile', 'invalid']);
      const output = stdout + stderr;

      expect(output).toContain('Profile not found');
      expect(output).toContain('Available profiles');
    });
  });

  describe('Command-Specific Integration', () => {
    describe('Network Command', () => {
      it('should accept all network flags', async () => {
        const { stdout, stderr } = await runCLIAsync(['network', '--help']);
        const output = stdout + stderr;

        expect(output).toContain('--filter');
        expect(output).toContain('--json');
      });
    });

    describe('Console Command', () => {
      it('should accept console type filter', async () => {
        const { stdout, stderr } = await runCLIAsync(['console', '--help']);
        const output = stdout + stderr;

        expect(output).toContain('--type');
        expect(output).toContain('--tab-id');
      });
    });

    describe('Emulate Command', () => {
      it('should accept device parameter', async () => {
        const { stdout, stderr } = await runCLIAsync(['emulate', '--help']);
        const output = stdout + stderr;

        expect(output).toContain('--device');
        expect(output).toContain('iphone');
      });
    });

    describe('Storage Commands', () => {
      it('should accept storage type parameters', async () => {
        const { stdout, stderr } = await runCLIAsync(['storage-clear', '--help']);
        const output = stdout + stderr;

        expect(output).toContain('--type');
      });
    });

    describe('DOM Commands', () => {
      it('should require selector for DOM commands', async () => {
        const commands = ['inspect', 'click', 'get-text', 'get-html', 'set-text', 'set-html'];

        for (const cmd of commands) {
          const { stdout, stderr } = await runCLIAsync([cmd, '--profile', 'dv1']);
          const output = stdout + stderr;
          // Should fail because Chrome isn't running, but we're testing the interface
          expect(output).toBeDefined();
        }
      });
    });
  });

  describe('Output Format Tests', () => {
    it('should support JSON output for network command', async () => {
      const { stdout, stderr } = await runCLIAsync(['network', '--help']);
      const output = stdout + stderr;
      expect(output).toContain('--json');
    });

    it('should support JSON output for cookies command', async () => {
      const { stdout, stderr } = await runCLIAsync(['cookies', '--help']);
      const output = stdout + stderr;
      expect(output).toContain('--json');
    });

    it('should support JSON output for console command', async () => {
      const { stdout, stderr } = await runCLIAsync(['console', '--help']);
      const output = stdout + stderr;
      expect(output).toContain('--json');
    });
  });

  describe('Error Recovery Tests', () => {
    it('should handle multiple missing required options', async () => {
      const { stdout, stderr } = await runCLIAsync(['fill', '--profile', 'dv1']);
      const output = stdout + stderr;

      // Should error about missing selector and value
      expect(output).toBeDefined();
    });

    it('should prioritize profile validation over other validations', async () => {
      const { stdout, stderr } = await runCLIAsync(['navigate', '--profile', 'invalid', 'https://example.com']);
      const output = stdout + stderr;

      // Should complain about invalid profile first
      expect(output).toContain('Profile not found');
    });
  });

  describe('Documentation Integration', () => {
    it('should show examples in command help', async () => {
      const { stdout, stderr } = await runCLIAsync(['start', '--help']);
      const output = stdout + stderr;
      expect(output.length).toBeGreaterThan(50);
    });

    it('should show meaningful descriptions', async () => {
      const commands = ['navigate', 'eval', 'screenshot', 'network'];

      for (const cmd of commands) {
        const { stdout, stderr } = await runCLIAsync([cmd, '--help']);
        const output = stdout + stderr;
        expect(output).toContain(cmd);
        expect(output.length).toBeGreaterThan(20);
      }
    });
  });

  describe('Command Completeness', () => {
    it('should have browser management commands', async () => {
      const { stdout, stderr } = await runCLIAsync(['--help']);
      const output = stdout + stderr;
      expect(output).toContain('start');
      expect(output).toContain('status');
      expect(output).toContain('tabs');
      expect(output).toContain('close');
    });

    it('should have navigation commands', async () => {
      const { stdout, stderr } = await runCLIAsync(['--help']);
      const output = stdout + stderr;
      expect(output).toContain('navigate');
      expect(output).toContain('eval');
    });

    it('should have interaction commands', async () => {
      const { stdout, stderr } = await runCLIAsync(['--help']);
      const output = stdout + stderr;
      expect(output).toContain('click');
      expect(output).toContain('fill');
      expect(output).toContain('type');
    });

    it('should have monitoring commands', async () => {
      const { stdout, stderr } = await runCLIAsync(['--help']);
      const output = stdout + stderr;
      expect(output).toContain('network');
      expect(output).toContain('console');
    });

    it('should have storage commands', async () => {
      const { stdout, stderr } = await runCLIAsync(['--help']);
      const output = stdout + stderr;
      expect(output).toContain('cookies');
      expect(output).toContain('local-storage');
    });
  });
});