import { stringify as yamlStringify } from 'yaml';
/** True when the user asked for a structured (machine) format. */
export function wantsStructured(options) {
    return !!(options.json || options.yaml);
}
/**
 * Serialize `data` in the requested structured format.
 * `--yaml` takes precedence if both are somehow set; otherwise JSON.
 * Callers should gate this behind `wantsStructured`.
 */
export function renderStructured(data, options) {
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
export function printStructured(data, options) {
    if (!wantsStructured(options))
        return false;
    console.log(renderStructured(data, options));
    return true;
}
//# sourceMappingURL=output.js.map