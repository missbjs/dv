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
 * Split a `>>>` selector into its trimmed segments.
 *
 * Rejects empty segments (`"host >>>"`, `"a >>> >>> b"`). An empty segment used to
 * compile to `querySelector('')`, which throws `SyntaxError: The provided selector is
 * empty` deep inside the page — a typo in the selector should not look like a page bug.
 */
export function splitShadowSelector(selector: string): string[] {
  const parts = selector.split('>>>').map((s) => s.trim());
  if (parts.some((p) => p.length === 0)) {
    throw new Error(
      `Invalid selector: "${selector}" — every ">>>" segment must name an element`
    );
  }
  return parts;
}

/**
 * Build the `document.querySelector(...)` chain that walks `parts` through shadow roots.
 *
 * Both hops are optional-chained: `?.shadowRoot?.querySelector(...)`. The `?.shadowRoot`
 * alone is not enough — `a?.b.c` only short-circuits when `a` is nullish, so a host that
 * exists but has no `shadowRoot` (a closed root, a custom element that never attaches one,
 * or a plain element) made the chain throw `Cannot read properties of null` mid-expression
 * instead of evaluating to `undefined`.
 */
function buildShadowChain(parts: string[]): string {
  let expr = 'document';
  for (let i = 0; i < parts.length; i++) {
    expr += `${i === 0 ? '' : '?'}.querySelector('${escapeJsString(parts[i])}')`;
    if (i < parts.length - 1) {
      expr += '?.shadowRoot';
    }
  }
  return expr;
}

/**
 * Build a JS expression that traverses shadow DOM using `>>>` syntax.
 *
 * `>>>` separates each level: `"host >>> .inner"` becomes
 * `document.querySelector('host')?.shadowRoot?.querySelector('.inner')`
 *
 * The `accessor` is appended at the end (e.g. `outerHTML`, `textContent`). Pass an empty
 * accessor to get the bare element chain with the `?? ''` tail omitted — appending `?.`
 * with nothing after it is a syntax error.
 */
export function buildShadowExpression(selector: string, accessor: string): string {
  const expr = buildShadowChain(splitShadowSelector(selector));
  if (!accessor) return expr;
  return `${expr}?.${accessor} ?? ''`;
}

/**
 * Build a JS expression that resolves to an element node (no accessor tail).
 *
 * Non-shadow: `document.querySelector('sel')`
 * Shadow `"host >>> .inner"`: `document.querySelector('host')?.shadowRoot?.querySelector('.inner')`
 *
 * The result may be `null`/`undefined` at runtime if any step misses; callers must guard.
 */
export function buildElementExpression(selector: string): string {
  if (!selector.includes('>>>')) {
    return `document.querySelector('${escapeJsString(selector)}')`;
  }
  return buildShadowChain(splitShadowSelector(selector));
}

/**
 * Build a JS expression resolving to every match of the last `>>>` segment.
 *
 * `"host >>> .row"` becomes
 * `(document.querySelector('host')?.shadowRoot?.querySelectorAll('.row') ?? [])`.
 * Always array-like, never null, so callers can `Array.from(...)` it directly.
 */
export function buildShadowListExpression(selector: string): string {
  const parts = splitShadowSelector(selector);
  if (parts.length === 1) {
    return `document.querySelectorAll('${escapeJsString(parts[0])}')`;
  }
  const last = parts.pop()!;
  const host = buildShadowChain(parts);
  return `(${host}?.shadowRoot?.querySelectorAll('${escapeJsString(last)}') ?? [])`;
}

/**
 * Build a JS expression that returns the center coordinates and dimensions
 * of an element selected via shadow-piercing `>>>` syntax.
 *
 * Returns `null` if the element is not found.
 */
export function buildShadowRectExpression(selector: string): string {
  const expr = buildShadowChain(splitShadowSelector(selector));
  return `(() => { const el = ${expr}; if (!el) return null; const r = el.getBoundingClientRect(); return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2, width: r.width, height: r.height }; })()`;
}

/** Check if a target string is a dv ref (e.g. "@e1", "@e1-2-3") */
export function isRef(target: string): boolean {
  return /^@e[\d]+(?:-[\d]+)*$/.test(target);
}

/**
 * Parse a comma-separated --props list into a clean array of property names.
 * Also splits on whitespace to handle PowerShell array-flattening (commas → spaces).
 */
export function parseProps(props?: string): string[] {
  if (!props) return [];
  return props
    .split(/[\s,]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
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
      // Skip trailing / or \ (Windows paths)
      if (pattern[i] === '/' || pattern[i] === '\\') i++;
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