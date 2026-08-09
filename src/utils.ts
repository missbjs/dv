import { getProfile } from './profiles.js';
import chalk from 'chalk';

export function getPortFromProfile(profileName: string): number {
  const profile = getProfile(profileName);
  if (!profile) {
    console.error(chalk.red(`Profile not found: ${profileName}`));
    console.error(chalk.yellow('Available profiles:'));
    console.error('  dv1 through dv6');
    process.exit(1);
  }
  return profile.port;
}

/** Escape a string for safe use inside a JS single-quoted string literal */
export function escapeJsString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

/**
 * Build a JS expression that traverses shadow DOM using `>>>` syntax.
 *
 * `>>>` separates each level: `"host >>> .inner"` becomes
 * `document.querySelector('host')?.shadowRoot?.querySelector('.inner')`
 *
 * The `accessor` is appended at the end (e.g. `outerHTML`, `textContent`).
 */
export function buildShadowExpression(selector: string, accessor: string): string {
  const parts = selector.split('>>>').map(s => s.trim());
  let expr = 'document';

  for (let i = 0; i < parts.length; i++) {
    expr += `.querySelector('${escapeJsString(parts[i])}')`;
    if (i < parts.length - 1) {
      expr += '?.shadowRoot';
    }
  }

  return `${expr}?.${accessor} ?? ''`;
}

/**
 * Build a JS expression that resolves to an element node (no accessor tail).
 *
 * Non-shadow: `document.querySelector('sel')`
 * Shadow `"host >>> .inner"`: `document.querySelector('host')?.shadowRoot.querySelector('.inner')`
 *
 * The result may be `null` at runtime if any step misses; callers must guard.
 */
export function buildElementExpression(selector: string): string {
  if (!selector.includes('>>>')) {
    return `document.querySelector('${escapeJsString(selector)}')`;
  }

  const parts = selector.split('>>>').map(s => s.trim());
  let expr = 'document';

  for (let i = 0; i < parts.length; i++) {
    expr += `.querySelector('${escapeJsString(parts[i])}')`;
    if (i < parts.length - 1) {
      expr += '?.shadowRoot';
    }
  }

  return expr;
}

/**
 * Build a JS expression that returns the center coordinates and dimensions
 * of an element selected via shadow-piercing `>>>` syntax.
 *
 * Returns `null` if the element is not found.
 */
export function buildShadowRectExpression(selector: string): string {
  const parts = selector.split('>>>').map(s => s.trim());
  let expr = 'document';

  for (let i = 0; i < parts.length; i++) {
    expr += `.querySelector('${escapeJsString(parts[i])}')`;
    if (i < parts.length - 1) {
      expr += '?.shadowRoot';
    }
  }

  return `(() => { const el = ${expr}; if (!el) return null; const r = el.getBoundingClientRect(); return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2, width: r.width, height: r.height }; })()`;
}

/** Check if a target string is a dv ref (e.g. "@e1", "@e1-2-3") */
export function isRef(target: string): boolean {
  return /^@e[\d]+(?:-[\d]+)*$/.test(target);
}

/**
 * Convert a glob pattern to RegExp.
 * Supports: `*` (any chars except /), `**` (any chars), `?` (single char).
 */
export function globToRegex(pattern: string): RegExp {
  let regexStr = '';
  let i = 0;
  while (i < pattern.length) {
    if (pattern[i] === '*' && pattern[i + 1] === '*') {
      regexStr += '.*';
      i += 2;
      // Skip trailing /
      if (pattern[i] === '/') i++;
    } else if (pattern[i] === '*') {
      regexStr += '[^/]*';
      i++;
    } else if (pattern[i] === '?') {
      regexStr += '[^/]';
      i++;
    } else {
      // Escape regex special chars
      const c = pattern[i];
      if ('\\^$(){}+|.[]'.includes(c)) {
        regexStr += '\\' + c;
      } else {
        regexStr += c;
      }
      i++;
    }
  }
  return new RegExp(`^${regexStr}$`, 'i');
}