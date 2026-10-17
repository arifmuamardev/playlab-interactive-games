# PlayLab — interactive game collection

A standalone, host-operated game collection for live events, workshops, and classrooms, and a portfolio case study. No organizational branding, authentication or database required.

## Game library

| Game | Status | Description |
|---|---|---|
| Survey Showdown | Working prototype | Survey-style top-answer guessing, strikes, points, steals, question editor |
| Quickfire Quiz | Working prototype | MC-operated multiple-choice questions, answer reveal, two-team scoreboard, JSON question-bank editing |
| Word Relay | Planned | Collaborative word games |
| Buzzer Battle | Planned | Buzzer-led rounds |

Both playable games include a separate projector display synchronized with the host window **within the same browser profile and origin** (BroadcastChannel / localStorage).

## How to run

- **No install / offline:** double-click `START-MAC.command` on macOS and visit `http://localhost:8765/`, or run `node serve.cjs`. The `dist/` directory is committed and contains an offline-capable build.
- **Development:** `npm install`, then `npm run dev`. The source is in `src/`.
- **Build / tests:** `npm run standalone`, then `npm test`. For Vite builds, use `npm run build`.
- **Publish:** the included GitHub Pages Actions workflow verifies the current source and builds fresh `dist/` output from the `main` branch. See `DEPLOYMENT.md`.

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

Read [the product plan](docs/PRODUCT-PLAN.md) and [the master plan](docs/MASTER-PLAN.md) for architecture goals, feature boundaries, and portfolio positioning.
