# PlayLab browser regression and release gate — milestone 2

## Test setup

- Playwright Chromium on GitHub Actions against a **fresh Vite production build** served locally by `vite preview`.
- `npm test` remains a fast pure-function/source-level check.
- `npm run test:e2e` exercises actual DOM, multiple windows in one browser context, localStorage / BroadcastChannel, and 360/390/768/1280 px catalog widths.
- Browser failure screenshots, traces, videos, and HTML report are uploaded only when CI fails (7-day retention).
- Production deployment from `main` now requires **both** source/build and browser jobs to pass; PRs run checks but cannot deploy.

## Verified automated behavior (when browser job is green)

1. Survey Showdown: reveal, wrong guesses, steal phase, manual point award, next round, reload of host and projector.
2. Same-origin/same-profile synchronization via storage events when `BroadcastChannel` is disabled.
3. Quickfire: answer reveal, team rename, points, next question, projector refresh, host refresh.
4. Games have separate score/session keys.
5. Catalog loads across representative viewport sizes without horizontal overflow.
6. Quickfire projector navigation can be reloaded after going offline, following prior cache warming.

## Known limitations and manual event rehearsal

- Browser automation emulates two pages sharing a browser profile, **not an actual HDMI/projector setup**. Physically rehearse second-screen placement, fullscreen, sound unlock, readability from the back of a room, and event Wi-Fi interruption.
- Multi-device synchronization and authenticated host access are not supported.
- Survey scores in sample data are synthetic; collect and label real survey data before use as a true survey game.
- If Playwright browser binaries cannot be obtained in CI, do not bypass the browser job to deploy. Investigate connectivity or use a preinstalled runner image / pinned browser cache.
- Offline behavior is scoped to previously visited/cached paths. Test clean-browser installation and desired caching strategy separately before promising fully offline first-run operation.

## Commands

```bash
npm install
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```
