# PlayLab — interactive game collection

![PlayLab game library](docs/screenshots/hub-desktop.png)

A standalone, host-operated game collection for live events, workshops, and classrooms, and a portfolio case study. No organizational branding, authentication or database required.

## Game library

| Game | Status | Description |
|---|---|---|
| Survey Showdown | Working prototype | Survey-style top-answer guessing, strikes, points, steals, question editor |
| Quickfire Quiz | Working prototype | MC-operated multiple-choice questions, answer reveal, two-team scoreboard, visual question-bank editing with JSON import/export |
| Word Relay | Planned | Collaborative word games |
| Buzzer Battle | Planned | Buzzer-led rounds |

Both playable games include a separate projector display synchronized with the host window **within the same browser profile and origin** (BroadcastChannel / localStorage).

## How to run

- **No install / offline:** double-click `START-MAC.command` on macOS and visit `http://localhost:8765/`, or run `node serve.cjs`. The repository includes an existing prebuilt snapshot; for the newest version run `npm install && npm run build` first. GitHub Pages always builds from source.
- **Development:** `npm install`, then `npm run dev`. The source is in `src/`.
- **Build / tests:** `npm test`, then `npm run build` (also creates the offline service worker).
- **Publish:** the included GitHub Pages Actions workflow deploys `dist/` from the `main` branch. See `DEPLOYMENT.md`.

## Run a session

1. Start on the **game library** landing page.
2. Open a playable game. Customize its questions and teams.
3. Click **Open projector** and drag the separate window to the audience screen.
4. Optionally put the audience window in fullscreen.
5. Operate scores and answer reveals from the host window.

Use a single laptop for both windows. Multi-device participation would require a hosted realtime backend and session authentication, which are *not yet implemented*.

## Survey data

All survey-style answers and points in the bundled demo are **invented demonstration values**, not results from real participants. For a real survey round, collect responses first and replace the example bank. The trivia game includes objective sample questions.

## Product roadmap

- Shared game engine API (`GameDefinition`, `GameSession`, `HostView`, `AudienceView`) and game-specific plugins
- Reusable event / classroom game packs, localization, accessible keyboard control and timers
- Optional realtime session codes for devices, with explicit privacy/security protections
- Browser-based visual tests and projector stress checks before event production usage

## Portfolio positioning

Position as a **browser-based interactive event and classroom toolkit** demonstrating frontend architecture, local-first state synchronization, question-data modeling, host/audience UX, offline delivery, and repeatable deployments.

Non-affiliated entertainment demo; not an official TV game-show franchise.

## Screenshots

- [Survey Showdown control room](docs/screenshots/survey-host.png)
- [Quickfire Quiz control room](docs/screenshots/quickfire-host.png)

Read [the product plan](docs/PRODUCT-PLAN.md) for architecture goals, honest feature boundaries and portfolio positioning.

## Modular architecture (v0.3 development)

- `src/core/useSyncedSession.js` provides local-first host/projector synchronization.
- `src/core/gameRegistry.js` defines catalog metadata.
- `src/games/survey/index.jsx` hosts the survey mechanics, with pure rules in `src/data.js`.
- `src/games/quickfire/index.jsx` hosts Quickfire, with pure rules in `src/games/quickfire/data.js`.
- `src/components/shared.jsx` holds reusable presentation components.
- `src/main.jsx` routes playable game modules; planned games only appear in the catalog.

Changes to source are verified by `npm test` and `npm run build` in GitHub Actions. Cross-device multiplayer is not implemented; the shared session hook only syncs windows in the same browser profile.

## Classroom and event starter templates + safe rehearsal

The dashboard setup wizard now includes two built-in Survey templates and two Quickfire templates. Choose **Ready-to-use classroom & event templates** in the Questions step. Every Survey point value is **fictional demonstration data**; it must not be presented as collected survey research.

On the Review step, **Practice without affecting live game** opens a separate browser tab in rehearsal mode. Its localStorage keys and BroadcastChannel identifiers are independent from the real host and projector; rehearsal scores, reveals, edits and reset commands do not change the live session or saved question packs. The rehearsal tab can open its own audience projector window. A new rehearsal for the same game replaces the earlier rehearsal state. The normal **Launch host controls** action still asks before replacing a saved match. This is a software rehearsal and **does not replace physical HDMI/projector and sound validation**.

## Guided game setup (dashboard)

From **My Dashboard → Game setup** (or a game's **Set up** link), choose Survey Showdown or Quickfire Quiz, select demo questions, existing match questions, or a compatible saved question pack, name both teams, review the planned reset and launch the host controls. The wizard changes nothing until **Launch host controls**; if a saved match exists, it asks for confirmation before clearing scores and progress. Your question library is not deleted. Open the projector from the host screen. Setup is local to this browser profile, not cross-device sync.

## My Dashboard (local-first workspace)

Open `?page=dashboard` from the game catalog. The Overview and My Games tabs show current browser-local game sessions; Question packs lets you save, import, export and load versioned game content. Pack operations require confirmation before replacing an active game. No account or database is required. Data does not sync to other devices; export important packs as a backup.

See [Dashboard MVP](docs/DASHBOARD-MVP.md) for the precise format, limitations, and test plan.

## Shared Game Builder

Survey and Quickfire now use one accessible editor shell, question-list navigation and immutable draft hook, while retaining game-specific answer fields and validation. Changes are saved only through each game's existing confirmation/reset behavior. See [shared builder architecture](docs/SHARED-GAME-BUILDER.md).

## Gameplay control-room polish

The Survey and Quickfire host control rooms now use the playful PlayLab visual vocabulary while retaining the existing projector layout, question formats, browser storage keys, and game rules. Survey includes a visible round-state / score-bank summary, selected-team accessibility state, and prevents awarding an empty score bank. Quickfire adds a live status strip, **R** reveal/hide, **N/P** next/previous question, **U** undo the most recent manual score change, and a single-step **Undo last score change** button. Shortcuts are disabled while typing or using the question editor. Undo restores the exact previous score totals even when subtraction was clamped at zero.

All state still belongs to one browser profile and origin; neither live account sync nor cross-device multiplayer has been added. Host-only styling does not replace the separate audience projector display.
