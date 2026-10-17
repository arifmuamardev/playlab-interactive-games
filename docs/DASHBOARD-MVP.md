# PlayLab Dashboard — local-first MVP

The dashboard is available at `?page=dashboard`. It is distinct from the public game catalog at `./` and the host/projector game routes at `?game=survey` and `?game=quickfire`.

## Delivered

- Responsive workspace with Overview, My Games, Question Packs; no mandatory login.
- Real, browser-local counts (playable games, saved content packs, and games with saved sessions). Counts are **not** online users or historical session totals.
- Resume existing matches by using the game host links.
- Start a fresh match (confirmation required, retains prepared questions and team names).
- Save current game questions as separately versioned content packs; never includes scores or progress.
- Import/export individual PlayLab packs as `.json`; strict schema + version checks, per-game validation, size and pack-count limits.
- Load a pack into a compatible game with a destructive-change warning; resets that match's scores/reveals. LocalStorage notifies open host/projector windows in the same browser profile.
- Storage events and window focus refresh dashboard summaries when changes happen in other windows.

## Pack format

`{ "schema": "playlab.question-pack", "version": 1, "id": "...", "name": "...", "game": "survey|quickfire", "questions": [...], "createdAt": "ISO date" }`

Local library stored as `{version:1,packs:[...]}` under `playlab-content-packs-v1`. Original session keys are preserved. The dashboard does not require or configure a backend. Imported packs get fresh IDs and never execute code.

## Data and privacy

- All data remains in the *current browser profile*; another device, private mode, cleared site data or a different browser profile will not share the library.
- Export question packs regularly to preserve them before browser data is cleared. There is no automatic backup, cloud sync, account, remote session history, or analytics.
- Survey Showdown example point values remain fictional. A saved sample pack is not real survey evidence.
- Only one host should control the same game. Loading packs while a match is running overwrites active progress, and the dashboard explicitly requires confirmation.

## Quality gates

- `npm test` checks schema, game isolation, resets, version rejection and pack handling.
- Playwright tests run on GitHub PRs: navigation, save/import/export/delete, live cross-tab sync, reset prompts and responsive widths 360–1280 px.
- CI gates Pages publication. Physical projector testing and detailed screen-reader testing remain outstanding.

## Next iteration

Unified editors and multiple independent saved match instances, followed by optional account/cloud sync. Avoid representing a single current browser session as historical analytics.
