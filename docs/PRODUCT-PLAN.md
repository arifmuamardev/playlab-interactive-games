# PlayLab: product plan (v0.2)

## Positioning

**PlayLab** (working title) is an independent collection of host-led browser games for real-world spaces: classroom activities, community meetups, training sessions, family gatherings, workshops, and events. Its core promise is simple operation, a lively audience display, reusability, and no mandatory accounts. It is built as an independent software-development portfolio project, not as an organization-specific product.

## Current version, what actually works

- A navigable home/game library with two playable games: **Survey Showdown** and **Quickfire Quiz**.
- A two-screen flow per game: one host window and a projector/audience window, synchronized on the **same device, browser profile and origin** using localStorage + BroadcastChannel.
- Local-first question editing (Survey editor UI; Quickfire JSON editor), team scoring, persistent local state, reset, and offline-capable static build.
- Example game data is provided; survey results are fictional and should never be described as real data.

## Short-term improvements

1. **Architecture refactor:** extract shared shell, game registry, editor contracts and session state into separate modules. The current games are functional but still bundled in one main component; plugin architecture is an intended refactor, not a finished feature.
2. **Session integrity:** separate draft content from a live match; protect against accidental resets and stale viewers; add explicit rehearsal mode.
3. **Better classroom UX:** configurable points, countdown timers, teacher notes, and selectable languages for UI and example packs.
4. **Quality:** browser-based desktop/mobile tests, accessibility review, screen and projector layout testing, a reproducible build lockfile and GitHub Actions validation.

## Next games to build

- **Buzzer Battle:** host-judged speed rounds, local hardware/software buzzer options.
- **Word Relay:** rotating turns, categories, countdown timer, optional teaching prompts.
- Later ideas: picture guessing, word cloud rounds, ordering challenges, matching pairs, bingo, classroom review race.

## Future real-time mode (separate milestone)

For multiple phones or participant devices, add a real-time backend, short-lived room codes, role-based permissions and a reconnect/resume strategy. Local-only mode stays the default for simple on-stage events. Avoid storing unnecessary participant identifiers.

## Platform architecture: target interfaces

- `GameManifest`: ID, title, summary, requirements, game rules, questions schema.
- `GameSession`: active round, scores, authoritative event log, persistence.
- `HostView`: facilitator controls and content management.
- `AudienceView`: projector-safe presentation.
- `GameRegistry`: discovers installed game modules; no game-specific conditionals in the core shell.

The v0.2 implementation is an initial portfolio prototype. It does **not** yet implement a full plugin registry, user accounts, cross-device synchronization, analytics, or cloud content management.

## Portfolio narrative

**Problem:** public events and classes need a lively game experience without setting up phones or accounts.

**Solution:** static browser platform, host and projector experiences, editable questions, scoring and local synchronization.

**Engineering evidence:** component separation goals, data validation, local-first persistence, sound/animation UX, responsive library page, automated checks, deployment workflow.

**Showcase:** README + screenshots, published demo link, 60-second two-screen walkthrough video, clear caveats and roadmap.
