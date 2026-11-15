# dv — browser/CDP wrapper

This project builds the `dv1`…`dv128` commands. Agents working on the codebase
itself follow the same rules as everyone else: use dv1…dv128 only.

## Browser / DOM work — always dv1…dv128, never raw MCP

For ANY browser automation, DOM inspection, or DevTools Protocol work:

- **Use the `dv1`…`dv128` commands exclusively.** Never run bare `dv`,
  `dv.exe`, or pass `--profile` — each dvN is pinned to one fixed Chrome
  profile and no other profile may ever be created.
  - **Default to `dv1`** unless the user names another profile.
  - **Concurrency is per-tab, not per-profile.** Many tasks can run at once,
    even on the same profile (dv1): get tab IDs from `dv1 tabs`, then pass
    `--tab <id>` on every per-tab command (navigate, eval, click, …).
    Without `--tab`, commands resolve to the focused tab and concurrent
    calls collapse onto the same page. `dv1 windows` shows which OS window
    holds which tab, and `dv1 new <url> --window` detaches a tab into its
    own window — the tab ID still works like any other. Tab IDs work
    across any window of the profile.
  - Don't log out, clear cookies, or reset a profile's session unless the
    user asks — logins on these profiles are the user's.
  - **If you're ever unsure what `dv1`…`dv128` (or a specific one, e.g.
    "dv6") refers to, don't ask the user to clarify.** Just run
    `dv6 --help` (any dvN works) and self-resolve from its output.
- **Do NOT call the Chrome DevTools Protocol directly.** That means no
  `chrome-devtools-mcp`, no `chrome-mcp-server`, no raw CDP via WebSocket,
  no Playwright/Puppeteer/Chromium drivers — they spawn Chrome with a
  *different* `--user-data-dir` than dv, breaking profile state, cookies,
  extensions, and login sessions.
- **Do NOT spawn a fresh Chrome instance yourself.** `dv1 start` (…`dv128 start`)
  is the only sanctioned launcher.
- **Do NOT `npx chrome-devtools-mcp`** or any equivalent under any name.
  The package itself is hostile to the dv workflow — every agent that has
  reached for it has corrupted browser state.

### Routing rule

If you find yourself wanting to call `mcp__chrome-devtools__*`,
`mcp__chrome-mcp-server__*`, `mcp__playwright__*`, `mcp__puppeteer__*`,
`chrome --remote-debugging-port=…`, or `node …/chrome-remote-interface`,
stop and route through dv1…dv128 instead. Each dvN owns one fixed Chrome
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

Profiles `dv2`–`dv128` exist so heavy tasks can get their own Chrome (own
user-data-dir and remote debugging port). But you do NOT need a separate
profile to run tasks in parallel — same-profile tabs with `--tab` already
give full isolation per task.

### When reviewing dv itself

If you're debugging dv's own source, you obviously need to read CDP
output. Use the already-running dv1…dv128 Chrome to inspect its own behavior,
or test changes against a different profile (e.g. develop on `dv2` while
`dv1` stays on a known-good baseline). Never `puppeteer.launch()` inside
dv's own test suite unless the test specifically exercises that path.
