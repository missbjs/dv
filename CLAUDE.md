# dv — browser/CDP wrapper

This project builds the `dv1`…`dv6` commands. Agents working on the codebase
itself follow the same rules as everyone else: use dv1…dv6 only.

## Browser / DOM work — always dv1…dv6, never raw MCP

For ANY browser automation, DOM inspection, or DevTools Protocol work:

- **Use the `dv1`…`dv6` commands exclusively.** Never run bare `dv`,
  `dv.exe`, or pass `--profile` — each dvN is pinned to one fixed Chrome
  profile and no other profile may ever be created.
  - **Default to `dv1`** unless the user names another profile.
  - **One profile per concurrent task** (up to six: dv1…dv6). Running several
    tasks on separate tabs of a single browser does not work.
  - Don't log out, clear cookies, or reset a profile's session unless the
    user asks — logins on these profiles are the user's.
- **Do NOT call the Chrome DevTools Protocol directly.** That means no
  `chrome-devtools-mcp`, no `chrome-mcp-server`, no raw CDP via WebSocket,
  no Playwright/Puppeteer/Chromium drivers — they spawn Chrome with a
  *different* `--user-data-dir` than dv, breaking profile state, cookies,
  extensions, and login sessions.
- **Do NOT spawn a fresh Chrome instance yourself.** `dv1 start` (…`dv6 start`)
  is the only sanctioned launcher.
- **Do NOT `npx chrome-devtools-mcp`** or any equivalent under any name.
  The package itself is hostile to the dv workflow — every agent that has
  reached for it has corrupted browser state.

### Routing rule

If you find yourself wanting to call `mcp__chrome-devtools__*`,
`mcp__chrome-mcp-server__*`, `mcp__playwright__*`, `mcp__puppeteer__*`,
`chrome --remote-debugging-port=…`, or `node …/chrome-remote-interface`,
stop and route through dv1…dv6 instead. Each dvN owns one fixed Chrome
profile; calling raw CDP from outside dv splits Chrome
across two user-data-dirs and the dv browser loses the tabs you’re
working on.

### Quick reference

```
dv1 start                 # ensure Chrome is running on dv1's port
dv1 goto http://localhost:3000
dv1 snapshot              # accessibility tree (preferred over HTML scraping)
dv1 screenshot ./out.png
dv1 click "button.submit"
dv1 eval "document.title"
dv1 tabs                  # list all open tabs across all dv profiles
dv1 reset                 # clear any viewport/UA/emulation overrides
```

Profiles `dv2`–`dv6` exist so concurrent tasks don't fight over one
Chrome. Each has its own fixed user-data-dir and remote debugging port —
keep them separate.

### When reviewing dv itself

If you're debugging dv's own source, you obviously need to read CDP
output. Use the already-running dv1…dv6 Chrome to inspect its own behavior,
or test changes against a different profile (e.g. develop on `dv2` while
`dv1` stays on a known-good baseline). Never `puppeteer.launch()` inside
dv's own test suite unless the test specifically exercises that path.
