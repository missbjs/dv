# Handoff — every `>>>` selector is invisible to the interaction commands

**Repo:** `@missbjs/dv` (this one), version **1.0.7** at `751479c`.
**Reported from:** `@woby/wui` editor testing, where the entire UI lives inside one
custom element's shadow root and so *no* dv interaction command could reach any of it.
**Status:** diagnosed, reproduced, root cause proven at the CDP level. **Not fixed — nothing
in this repo has been modified.**

---

## The bug in one line

`DOM.requestNode` returns `nodeId: 0` unless the DOM agent has been primed with
`DOM.getDocument` first, and `resolveNodeId`'s `>>>` branch never primes it — so every
shadow-piercing selector reports **`Element not found`** even when the element is right
there and `query` can read it.

## Why it matters

The `>>>` syntax is advertised as the way to work with Shadow DOM, and half of it works:
the *value* commands (`query --text/--html/--attr/--computed-style`, `get-text`, `get-html`,
`read`) go through `Runtime.evaluate` and are fine. The *interaction* commands —
`click`, `dblclick`, `hover`, `focus`, `drag`, `scroll`, `highlight`, `upload`, `get-box` —
all go through `resolveNodeId`, and every one of them fails.

For a page built out of custom elements that is not a partial outage, it is a total one:
dv can tell you what the button says but cannot press it. The error message actively
misleads — `Element not found` sends you off checking your selector, which is correct,
against an element `query` will happily print for you one command later.

```
$ dv4 query "wui-editor >>> img" --attr src
https://picsum.photos/400/300                    <- found

$ dv4 hover "wui-editor >>> img"
Error: Element not found: wui-editor >>> img     <- same selector, same tab, same second
```

## Reproduction (verbatim, dv 1.0.7, live tab)

Any page with an open shadow root will do. Below, `wui-editor` is a custom element whose
shadow root contains an `<img>`.

```
$ dv4 hover "wui-editor >>> img"
Hovering over "wui-editor >>> img"...
Error: Element not found: wui-editor >>> img

$ dv4 focus "wui-editor >>> img"
Error: Element not found: wui-editor >>> img

$ dv4 click "wui-editor >>> img"
Error: Element not found: wui-editor >>> img

$ dv4 dblclick "wui-editor >>> img"
Error: Element not found: wui-editor >>> img

$ dv4 scroll -s "wui-editor >>> img" -y 50
Error: Element not found: wui-editor >>> img

$ dv4 highlight -s "wui-editor >>> img"
Error: Element not found: wui-editor >>> img

$ dv4 drag -s "wui-editor >>> img" -t "x=300,y=300"
Error: Element not found: wui-editor >>> img

$ dv4 get-box "wui-editor >>> img"
Error: Cannot read properties of null (reading 'content')     <- different failure, see below

$ dv4 get-box "body"                                          <- control: light DOM is fine
Box model for "body":
  Position: (20, -473.63)
  Size: 1568.18 × 1742.83
```

A minimal page to reproduce against, if you do not have one handy:

```html
<x-host></x-host>
<script>
customElements.define('x-host', class extends HTMLElement {
  connectedCallback() {
    const root = this.attachShadow({ mode: 'open' })
    const btn = document.createElement('button')
    btn.textContent = 'press me'
    btn.style.cssText = 'width:200px;height:60px'
    btn.addEventListener('click', () => console.log('pressed'))
    root.appendChild(btn)
  }
})
</script>
```

Then `dv4 query "x-host >>> button" --text` prints `press me`, and
`dv4 click "x-host >>> button"` says `Element not found`.

## Root cause, proven at the raw CDP level

Two **fresh** WebSocket sessions against the same tab, the second differing only by one
added call. Every dv command is its own connect/close, so a fresh session is exactly what
dv gives the DOM agent:

```
A: dv today — Runtime.evaluate -> DOM.requestNode, no priming
   Runtime.evaluate            objectId: yes   (className: HTMLImageElement)
   DOM.requestNode             -> { "nodeId": 0 }                <- silently no node

B: same, with DOM.getDocument first
   DOM.getDocument             -> root.nodeId 1
   Runtime.evaluate            objectId: yes   (className: HTMLImageElement)
   DOM.requestNode             -> { "nodeId": 97 }
   DOM.getBoxModel             -> 400x300                        <- what get-box wants
```

`DOM.requestNode` does not fail loudly. It returns `nodeId: 0`, and `resolveNodeId` turns
that into the misleading throw:

```ts
const { nodeId } = await this.send('DOM.requestNode', { objectId });
if (!nodeId) {
  throw new Error(`Element not found: ${selector}`);   // src/cdp.ts:303-305
}
```

The non-`>>>` branch four lines below **does** call `DOM.getDocument` — which is exactly why
plain CSS selectors work and piercing ones do not. The priming is there; it is just on the
wrong branch.

### Which priming call is enough

Tested the same way, one fresh session each:

| Primed with | `DOM.requestNode` result |
|---|---|
| nothing (dv today) | `nodeId: 0` |
| `DOM.enable` | `nodeId: 0` — **not** sufficient |
| `DOM.getDocument { depth: 0 }` | `nodeId: 97`, box `400x300` |
| `DOM.getDocument {}` (default depth 1) | `nodeId: 97`, box `400x300` |

So `DOM.enable` is not the fix, and the full-tree walk is not needed: **`DOM.getDocument`
with `depth: 0`** is enough and is the cheapest option.

## Evidence in this repo

| What | Where |
|---|---|
| `>>>` branch — `Runtime.evaluate` → `DOM.requestNode`, no `getDocument` | `src/cdp.ts:293-309` |
| the `!nodeId` → `Element not found` throw | `src/cdp.ts:303-305` |
| non-`>>>` branch, which *does* prime | `src/cdp.ts:312-316` |
| `connect()` — no DOM priming of any kind | `src/cdp.ts:86-191` |
| `DOM.enable` | **appears nowhere in `src/`** |
| `buildElementExpression`, the `>>>` → JS compiler (correct, not at fault) | `src/utils.ts:54-76` |

## Affected commands

Every caller of `resolveNodeId`. All fail for `>>>` selectors, all work for plain CSS.

| Command | `cdp.ts` method | Line |
|---|---|---|
| `click` | `click` | 324 |
| `get-box` | `getBoxModelBySelector` | 885 |
| `hover` | `hoverBySelector` | 944 |
| `focus` | `focusBySelector` | 975 |
| `scroll -s` | `scrollIntoView` | 1008 |
| `highlight -s` | `highlightNode` | 1038 |
| `upload -s` | `setFileInputFilesBySelector` | 1067 |
| `drag -s/-t` | `dragAndDrop` | 1078, 1084 |
| `dblclick` | `dblclick` | 1128 |

## A second, separate defect: `get-box` dereferences null

`getBoxModelBySelector` swallows the `>>>` failure and returns `null` (`src/cdp.ts:884-890`),
but `src/commands/get-box.ts:20-28` reads `box.content[0]` unguarded, so the user sees

```
Error: Cannot read properties of null (reading 'content')
```

instead of anything actionable. Worth fixing even after the priming fix lands, because the
same `null` comes back for a genuinely missing element. Note the asymmetry while you are in
there: the `>>>` path returns `null` on failure, the CSS path throws `Element not found`.
Pick one.

## Suggested fix

One line, in the `>>>` branch of `resolveNodeId` (`src/cdp.ts:294`):

```ts
if (selector.includes('>>>')) {
  // DOM.requestNode returns nodeId 0 unless the DOM agent already holds a node tree,
  // and every dv command is a fresh connect. depth 0 is enough -- we only need the
  // agent primed, not the tree serialised.
  await this.send('DOM.getDocument', { depth: 0 });
  const expression = buildElementExpression(selector);
  ...
```

Alternatives considered, for whoever picks this up:

- **Prime in `connect()` instead.** Fixes this and any future `requestNode` caller, at the
  cost of one extra round trip on every single command including `console` and `tabs`.
  Defensible, but it makes cheap commands pay for an expensive one's setup.
- **Skip `requestNode` entirely** and drive the interaction commands from the `objectId`
  via `Runtime.callFunctionOn` + `getBoundingClientRect`. Larger change, and it loses
  `DOM.scrollIntoViewIfNeeded`, which several of these methods rely on.

The one-line version is the one this reproduction supports.

## How to verify after fixing

```
dv4 query "x-host >>> button" --text        # must still print: press me
dv4 get-box "x-host >>> button"             # must print Size: 200 × 60, not an error
dv4 hover  "x-host >>> button"              # must exit 0
dv4 click  "x-host >>> button"              # must log "pressed" in dv4 console
dv4 get-box "body"                          # control: plain CSS must not regress
```

The `click` line is the one that matters — `get-box` succeeding only proves the nodeId
resolved, not that the coordinates are right.

## What was *not* verified

- The fix was proven at the CDP level (probe B above: `requestNode` → `getBoxModel` →
  `400x300`). It was **not** applied to this repo and the CLI was **not** re-run against it.
- Only `mode: 'open'` shadow roots were tested. `buildElementExpression` walks `.shadowRoot`,
  so closed roots cannot work and never could — out of scope here.
- Nested `>>>` chains (`a >>> b >>> .c`) were not exercised; the failure is in the shared
  `requestNode` call, so depth should not matter, but it is untested.

## Workaround in the meantime

For the `@woby/wui` work this came out of, the interaction commands were replaced with a
~120-line script talking to the same debugging port directly: `Runtime.evaluate` to read the
element's `getBoundingClientRect`, then `Input.dispatchMouseEvent` / `Input.dispatchTouchEvent`
at those coordinates. That sidesteps `requestNode` completely. It works, but it is a
per-project reimplementation of what `dv click` is supposed to be.

`dv4 query --computed-style` and `get-text`/`get-html` need no workaround — those paths were
never affected.
