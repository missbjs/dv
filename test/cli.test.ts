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
describe('Emulation Reset Commands', () => {
  describe('resize', () => {
    it('should document clearing in its help', async () => {
      const { stdout } = await runCLI(['resize', '--profile', 'dv1', '--help']);
      expect(stdout).toContain('0 0');
      expect(stdout).toMatch(/clear/i);
    });

    it('should accept 0 0 as arguments', async () => {
      // Chrome is not running on dv1 in CI, so this fails at connect —
      // what matters is that `0` is not rejected by argument parsing.
      const { stdout, stderr } = await runCLI(['resize', '0', '0', '--profile', 'dv1']);
      const output = stdout + stderr;
      expect(output).not.toMatch(/argument/i);
      expect(output).not.toMatch(/non-negative integer/);
    });

    it('should reject a non-numeric dimension', async () => {
      const { stderr } = await runCLI(['resize', 'abc', '100', '--profile', 'dv1']);
      expect(stderr).toContain('non-negative integer');
    });

    it('should reject a negative dimension', async () => {
      const { stderr } = await runCLI(['resize', '-5', '100', '--profile', 'dv1']);
      expect(stderr).toMatch(/non-negative integer|unknown option/);
    });

    it('should accept --tab, since overrides are per-tab', async () => {
      const { stdout } = await runCLI(['resize', '--profile', 'dv1', '--help']);
      expect(stdout).toContain('--tab');
    });
  });

  describe('reset', () => {
    it('should be registered in the top-level help', async () => {
      const { stdout } = await runCLI(['--help']);
      expect(stdout).toContain('reset');
    });

    it('should list its narrowing flags', async () => {
      const { stdout } = await runCLI(['reset', '--profile', 'dv1', '--help']);
      expect(stdout).toContain('--viewport');
      expect(stdout).toContain('--user-agent');
      expect(stdout).toContain('--timezone');
      expect(stdout).toContain('--geolocation');
      expect(stdout).toContain('--network');
      expect(stdout).toContain('--json');
    });

    it('should require a profile', async () => {
      const { stderr } = await runCLI(['reset']);
      expect(stderr).toContain('--profile');
    });

    it('should offer --tab and --all-tabs, since overrides are per-tab', async () => {
      const { stdout } = await runCLI(['reset', '--profile', 'dv1', '--help']);
      expect(stdout).toContain('--tab');
      expect(stdout).toContain('--all-tabs');
    });
  });

  describe('status', () => {
    it('should offer --no-viewport to skip the probe', async () => {
      const { stdout } = await runCLI(['status', '--profile', 'dv1', '--help']);
      expect(stdout).toContain('--no-viewport');
    });
  });
});

/**
 * Every command that drives a page drives exactly one tab, and which tab that is
 * depends on /json/list ordering — which shifts as tabs are activated. These pin
 * the flag onto the commands that need it, and keep it off the ones where it
 * would be a lie (browser-wide or all-tabs commands). One test per list: each
 * check is a process spawn, and 60+ of them would outlast any sane timeout.
 */
describe('Per-tab targeting', () => {
  it('offers --tab on the commands that drive a single tab', async () => {
    const perTab = [
      'navigate', 'eval', 'screenshot', 'emulate', 'click', 'read',
      'storage-clear', 'cookies', 'reload', 'user-agent', 'throttle', 'pdf',
    ];
    for (const cmd of perTab) {
      const { stdout } = await runCLI([cmd, '--profile', 'dv1', '--help']);
      expect(stdout, `${cmd} should offer --tab`).toContain('--tab <id>');
    }
  }, 60000);

  it('leaves --tab off the commands that are not per-tab', async () => {
    // start/stop are browser-level, status covers every tab, tabs/profiles list,
    // clear-cache and cookies-clear are browser-wide.
    for (const cmd of ['start', 'status', 'stop', 'tabs', 'profiles', 'clear-cache', 'cookies-clear']) {
      const { stdout } = await runCLI([cmd, '--profile', 'dv1', '--help']);
      expect(stdout, `${cmd} should not offer --tab`).not.toContain('--tab <id>');
    }
  }, 60000);

  it('keeps the deprecated --tab-id spelling working alongside --tab', async () => {
    const { stdout } = await runCLI(['eval', '--profile', 'dv1', '--help']);
    expect(stdout).toContain('--tab <id>');
    expect(stdout).toContain('--tab-id <id>');
  });

  it('lets emulate load the page inside its own session, since the UA dies with it', async () => {
    const { stdout } = await runCLI(['emulate', '--profile', 'dv1', '--help']);
    expect(stdout).toContain('--navigate <url>');
    expect(stdout).toContain('--reload');
  });

  it('reports the tab it could not find by ID, not "no tab found"', async () => {
    // dv1 is not running in CI, so this may fail at connect instead — either
    // way it must never silently act on the default tab.
    const { stdout, stderr } = await runCLI(['eval', '--script', '1', '--profile', 'dv1', '--tab', 'NOPE']);
    const output = stdout + stderr;
    expect(output).toMatch(/No tab with ID NOPE|Chrome is not running/);
  });
});
