import { stringify as yamlStringify } from 'yaml';

/**
 * Shared machine-readable output options. Every data-returning command mixes
 * these in so `--json` / `--yaml` behave identically across the whole CLI.
 * Human-readable output remains the default when neither flag is set.
 */
export interface OutputOptions {
  json?: boolean;
  yaml?: boolean;
}

/** True when the user asked for a structured (machine) format. */
export function wantsStructured(options: OutputOptions): boolean {
  return !!(options.json || options.yaml);
}

/**
 * Serialize `data` in the requested structured format.
 * `--yaml` takes precedence if both are somehow set; otherwise JSON.
 * Callers should gate this behind `wantsStructured`.
 */
export function renderStructured(data: unknown, options: OutputOptions): string {
  if (options.yaml) {
    // trimEnd: yaml.stringify appends a trailing newline; console.log adds its own
    return yamlStringify(data).replace(/\n$/, '');
  }
  return JSON.stringify(data, null, 2);
}

/**
 * If a structured format was requested, print `data` in it and return true.
 * Otherwise return false so the caller falls through to human-readable output.
 *
 *   if (printStructured(data, options)) return;
 *   // ...human-readable rendering here
 */
export function printStructured(data: unknown, options: OutputOptions): boolean {
  if (!wantsStructured(options)) return false;
  console.log(renderStructured(data, options));
  return true;
}
