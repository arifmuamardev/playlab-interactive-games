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

## Showtime: animated projector screens and opt-in sound

Both existing games now have livelier audience screens. Survey Showdown adds more expressive answer reveals, round transitions, score-winner emphasis, and brief CSS confetti on awards. Quickfire Quiz adds colored multiple-choice cards, animated correct-answer reveals, question transitions, and short score celebrations. The **Enable sound** button appears on each projector display: audio is **off by default** and only activates after a direct browser click (autoplay restrictions). It is synthesized with the local Web Audio API, with no sound downloads. The mute toggle works independently in each display tab and returns to off after refresh. When OS/browser reduced-motion is enabled, CSS disables the effects and confetti while preserving text, answers and scores. Existing host previews remain compact. No saved question packs, live session keys or host/projector sync channels changed. Rehearsal mode remains isolated. Test projector volume before a live event.

## Live playful design

The approved illustrated **playful game catalog** is now the default PlayLab homepage; the old editorial-style catalog is retired. The working **My Dashboard** also uses the same bright visual identity while retaining all real session, question-pack, import/export, and setup operations. The earlier Design Lab preview is still available at `?page=design-lab` for comparison. This design promotion does not alter game scoring, projectors, saved data, or local-storage keys.

## Playful Game Setup

The functional four-step **Game Setup** wizard now uses the same playful illustration-led design as the live PlayLab catalog and dashboard. All four steps (game choice, question source, team names, and match review) are styled, including practice mode and the safe live-launch confirmation. It remains local-first; no game logic, question-pack storage keys or synchronization semantics were changed. The previous minimalist wizard styling is retired.

## Game finish and final results (Gameplay Experience v2)

Both Survey Showdown and Quickfire Quiz hosts now offer **Finish match & show results**. The host confirms before finishing, then both the host and synchronized audience/projector view show a full-color final scoreboard. Winners and ties are calculated from the actual persisted scores. Survey totals include awarded round points; Quickfire shows manually awarded points. The result screen also shows completed/total rounds or revealed questions; finishing early is supported without pretending every question was played.

**Finish is not reset.** Scores, answer reveals, teams, progress, and question banks remain intact across refresh. The host can **Resume match** to correct a score, or **Reset & play again** (a separate destructive confirmation) to replay with the same questions and team names. The old localStorage keys, version 1 session formats, and separate rehearsal keys remain compatible; older sessions without `finished` default to playing. The projector remains muted until its **Enable sound** button is clicked, and celebratory motion respects reduced-motion preferences. Test on your actual projector and speakers before a live event.

## Live presenter workflow (v2)

Survey Showdown and Quickfire Quiz now share a **sticky, context-aware Live Host Controls bar** above the preview. It highlights the next safe action without changing game scoring or projector presentation. Survey guides hosts from answering and strikes to explicit team awards, next rounds and final results; a direct **Jump to answer buttons** control avoids scrolling to find the reveal list. When stealing, the host still chooses which team receives the bank; no points are awarded automatically. Quickfire places **Show answer**, explicit **+10 per team**, **Undo score change**, and **Continue to question** within the same workflow, progressing to an explicitly confirmed results action on the final question. The detailed host controls remain below the bar, and keyboard shortcuts continue to work. Mobile hosts get larger wrapped buttons and a compact sticky layout. The bar delegates to existing gameplay handlers, so session storage keys, rehearsal isolation, results, and projector synchronization are preserved.

## Ten ready-to-play sets and official game rules

PlayLab includes **five complete 8-round Survey Showdown sets** and **five complete 8-question Quickfire Quiz sets**, covering education, family, community, everyday life, travel, science, computing and logic. Browse all ten through the real Game Setup; the same official, honest rules can be opened in Setup or the active host control room. Bundled Survey scores are illustrative, not collected poll results. Full rulebook, set catalog, and safe rehearsal/launch instructions: [PlayLab ready-to-play sets and rules](docs/READY_TO_PLAY_AND_RULES.md).
