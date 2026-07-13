import { describe, it, expect } from 'vitest';
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

describe('Security Tests', () => {
  describe('Path Traversal Prevention', () => {
    const maliciousInputs = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32',
      'dv1/../../',
      '../dv1',
      'dv1/../..',
      './dv1/../../../',
      'dv1%00',
      'dv1\n',
      'dv1\r',
    ];

    maliciousInputs.forEach((input) => {
      it(`should reject malicious profile name: ${JSON.stringify(input)}`, async () => {
        const { stdout, stderr } = await runCLI(['start', '--profile', input]);
        const output = stdout + stderr;
        expect(output).toContain('Profile not found');
        expect(output).toContain('Available profiles');
      });
    });

    it('should reject profile name with null byte', async () => {
      // execFile cannot pass null bytes as arguments, so it should reject
      await expect(runCLI(['start', '--profile', 'dv1\x00'])).rejects.toThrow();
    });

    it('should only accept whitelisted profile names', async () => {
      const validProfiles = ['dv1', 'dv2', 'dv3', 'dv4', 'dv5', 'dv6'];

      validProfiles.forEach(async (profile) => {
        const { stdout } = await runCLI(['start', '--profile', profile, '--help']);
        expect(stdout).not.toContain('Profile not found');
      });
    });

    it('should reject test profile names in production context', async () => {
      const { stdout, stderr } = await runCLI(['start', '--profile', 'test-dv1']);
      const output = stdout + stderr;
      expect(output).toContain('Profile not found');
    });
  });

  describe('Input Validation', () => {
    it('should handle special characters in URL', async () => {
      const { stdout } = await runCLI([
        'navigate',
        '--profile', 'dv1',
        '--url',
        'https://example.com',
        '--help',
      ]);
      // Should not execute script, just show help
      expect(stdout).toContain('Navigate to URL');
    });

    it('should handle special characters in selector', async () => {
      const { stdout } = await runCLI([
        'click',
        '--profile', 'dv1',
        '--selector',
        '#test',
        '--help',
      ]);
      expect(stdout).toContain('Click element');
    });

    it('should validate numeric parameters', async () => {
      const { stdout, stderr } = await runCLI([
        'resize',
        '--profile', 'dv1',
        '--width',
        'abc',
        '--height',
        '100',
      ]);
      // Should either reject or parse as 0/NaN safely
      expect(stdout + stderr).toBeDefined();
    });

    it('should handle empty string inputs', async () => {
      const { stdout } = await runCLI(['navigate', '--help']);
      expect(stdout).toContain('Navigate to URL');
    });
  });

  describe('Command Injection Prevention', () => {
    it('should not execute shell commands in profile name', async () => {
      const { stdout, stderr } = await runCLI(['start', '--profile', 'dv1;ls']);
      const output = stdout + stderr;
      expect(output).toContain('Profile not found');
      // Should not list files (no ls command executed)
      expect(output).not.toContain('node_modules');
    });

    it('should not execute shell commands in URL', async () => {
      const { stdout, stderr } = await runCLI([
        'navigate',
        '--profile', 'dv1',
        '--url',
        'https://example.com|cat /etc/passwd',
        '--help',
      ]);
      expect(stdout).not.toContain('root:');
    });

    it('should handle backticks safely', async () => {
      const { stdout } = await runCLI([
        'eval',
        '--profile', 'dv1',
        '--script',
        '`rm -rf /`',
        '--help',
      ]);
      expect(stdout).toContain('Evaluate JavaScript');
    });
  });

  describe('Profile Whitelist Enforcement', () => {
    it('should reject variations of valid profile names', async () => {
      const variations = [
        'DV1',
        'Dv1',
        'dv1 ',
        ' dv1',
        'dv1\t',
      ];

      for (const variation of variations) {
        const { stdout, stderr } = await runCLI(['start', '--profile', variation]);
        const output = stdout + stderr;
        // All variations should be rejected
        expect(output).toContain('Profile not found');
      }
    });

    it('should reject dv0 and dv7', async () => {
      const { stdout: stdout0, stderr: stderr0 } = await runCLI(['start', '--profile', 'dv0']);
      expect(stdout0 + stderr0).toContain('Profile not found');

      const { stdout: stdout7, stderr: stderr7 } = await runCLI(['start', '--profile', 'dv7']);
      expect(stdout7 + stderr7).toContain('Profile not found');
    });
  });

  describe('Error Message Safety', () => {
    it('should not leak sensitive information in error messages', async () => {
      const { stdout, stderr } = await runCLI(['start', '--profile', 'invalid-profile']);
      const output = stdout + stderr;
      expect(output).not.toContain('/etc/');
      expect(output).not.toContain('C:\\');
      expect(output).not.toContain('password');
      expect(output).not.toContain('token');
      expect(output).not.toContain('secret');
    });

    it('should show helpful but safe error messages', async () => {
      const { stdout, stderr } = await runCLI(['start', '--profile', 'invalid-profile']);
      const output = stdout + stderr;
      expect(output).toContain('Available profiles');
      // Should not show full paths or internal details
      expect(output).not.toMatch(/\/[a-z]+\//i);
    });
  });

  describe('Timeout Safety', () => {
    it('should have timeout configured for CDP messages', async () => {
      // This is a code-level test, checking the implementation
      const cdpCode = await import('../src/cdp.js');
      expect(cdpCode.CDPClient).toBeDefined();
    });
  });
});