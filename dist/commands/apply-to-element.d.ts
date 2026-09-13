import { CDPClient } from '../cdp.js';
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
export declare function applyToElement(client: CDPClient, selector: string, body: string): Promise<void>;
//# sourceMappingURL=apply-to-element.d.ts.map