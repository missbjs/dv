import { buildElementExpression } from '../utils.js';
/**
 * Run a mutation against a single element, resolved with full `>>>` shadow-piercing
 * support, and fail loudly when it does not land.
 *
 * The `set-*` commands used to interpolate the raw selector into
 * `document.querySelector('...')`: a `>>>` selector made that throw `SyntaxError: ... is
 * not a valid selector`, an apostrophe in either the selector or the value broke out of
 * the string literal, and because the expression was wrapped in `if (el)` and the
 * exception was never inspected, every one of those failures still printed `✓`.
 *
 * `body` is a JS statement operating on a bound `el`. Embed values with
 * `JSON.stringify`, never string concatenation.
 */
export async function applyToElement(client, selector, body) {
    const expression = `(() => { const el = ${buildElementExpression(selector)}; if (!el) return false; ${body} return true; })()`;
    const result = await client.evaluate(expression);
    if (result.exceptionDetails) {
        const details = result.exceptionDetails;
        throw new Error(details.exception?.description?.split('\n')[0] ?? details.text);
    }
    if (result.result?.value !== true) {
        throw new Error(`Element not found: ${selector}`);
    }
}
//# sourceMappingURL=apply-to-element.js.map