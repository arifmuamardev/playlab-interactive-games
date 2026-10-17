# PlayLab — Interactive Games Platform
## Product strategy, technical architecture, and execution plan — v1.0

**Status:** Planning baseline. **PlayLab is a working product name**, not a verified unique brand. **No PPI-specific branding.** MainPintar catalog review is deferred until reference material is supplied; the plan does not claim feature parity with that product.

## 1. Vision and positioning

**Promise:** *Choose a game. Customize it. Play together.*

PlayLab is an independent, reusable browser platform for host-led interactive games used in classrooms, workshops, team-building events, student organizations, and community gatherings. A facilitator chooses a game template, edits or imports content, configures rules and teams, runs the session from a control panel, and displays the game on a projector. The default experience needs **one laptop and a screen**, **no sign-in**, and **no dependable internet connection once cached or launched locally**.

**Primary personas:** lecturers/teachers; event MCs/facilitators. **Secondary:** workplace trainers, clubs, families. **Initial jobs-to-be-done:** engage a room; review subject material; manage teams fairly; operate a game without technical support; reuse materials across sessions.

**Not initially:** a virtual classroom/LMS, phone-connected multiplayer, AI question generation, marketplace, paid subscription, learning management integration, player accounts, or a TV-game-show clone.

## 2. Product principles

1. **Live-event reliability over feature count.** An MC must never lose a live match because of a refresh or slow internet.
2. **Host first.** Make primary controls large, unambiguous, keyboard-accessible, and safe under pressure.
3. **Audience second screen is presentation-only.** Never expose question answers or editing controls on the display.
4. **Content is reusable and portable.** Export/import packs as versioned JSON; enable revisions without rewriting a game.
5. **Games are modular.** Share platform components, not inappropriate gameplay rules.
6. **Anonymous by default.** No personal profiles or participant data required for local play.
7. **Accessible and multilingual by design.** Indonesian and English UI/content should be supported without mixing display strings into engine logic.
8. **Honest demonstrations and legal assets.** Survey examples must be labeled fictional until based on an actual survey. Avoid reusing third-party names, logos, visuals, sounds, or copyrighted content.

## 3. Core user journey

1. **Discover:** browse/search catalog; filter by context, duration, group size, game type and input mode. Only show working templates as playable; planned templates are clearly marked.
2. **Explore:** see objective, rules, estimated setup, media example, audience size, and available controls.
3. **Create activity:** choose template, start sample session, or customize a saved pack; load a classroom topic or event pack.
4. **Configure:** teams, scoring, timing, rounds, language, display preferences, audio/reduced motion; preview both views.
5. **Rehearse:** demo mode allows testing without touching live results; verify external display readiness.
6. **Play:** MC runs controls; projector updates; scoring and session state persist; pause/resume, undo, next, and emergency reset safeguards.
7. **Finish/reuse:** show winners/results; optionally export session summary; preserve content pack separate from completed results.

## 4. Game catalog roadmap

| Category | Game | Mechanic | Target |
|---|---|---|---|
| Survey/guessing | **Survey Showdown** | Guess ranked survey responses, reveal, strikes, steal | Existing prototype: polish |
| Trivia/learning | **Quickfire Quiz** | Multiple choice, reveal, explanation, scoring | Existing prototype: polish |
| Knowledge | Quiz Board | Select topic/value tiles, answer, score | Early expansion |
| Icebreaker | Spin the Wheel | Configurable random selection and fairness rules | Early expansion |
| Word | Word Relay | Timed, turn-based words/categories | Later expansion |
| Reaction | Buzzer Battle | Host-adjudicated first response; real phone buzzer later | Later expansion |
| Image | Picture Reveal | Reveal image progressively; guess | Later expansion |
| Logic/memory | Memory Match | Reveal and match cards | Later expansion |
| Ordering | Sequence Challenge | Arrange steps/events correctly | Later expansion |
| Participation | Bingo | Generate cards, call items, verify win | Later expansion |

**Launch cap:** ship two polished games first, then add two new mechanics only after platform gates pass. Future catalog target may reach ~15–20 games, but no arbitrary count is a launch metric. Choose new games by variety of mechanic, classroom/event relevance, and implementation/test cost.

**Content packs:** demonstrate cross-context reuse with at least (a) General Knowledge, (b) University Classroom, (c) Community Icebreaker; clearly distinguish survey demos from actual sampled results. Allow both Indonesian and English packs.

## 5. Product requirements

### Essential MVP / v1 release
- Game catalog landing, detail/rules/preview pages, real playable-state labels.
- Two complete games: Survey Showdown and Quickfire Quiz.
- Host panel, projector panel, same-laptop synchronization and resync after refresh.
- Team naming, scores, clear round phases, undo for critical actions, pause/resume or equivalent session hold.
- Shared setup flow with game-specific configuration when necessary.
- Visual question editor for **both** initial games. No mandatory raw JSON editing for ordinary users.
- Content pack save, duplicate, versioned JSON import/export, validation and sample pack reset.
- Separate live session from editable draft: editing content cannot silently erase an ongoing match.
- Confirmation for destructive actions; explicit backup/restore path; projector safe-display controls.
- Responsive catalog and host screens; fixed large-screen projector layout; bilingual-ready text architecture.
- Stable offline/standalone build; repository documentation and automated checks.

### Later / advanced
- Presenter notes, per-game timer options, activity presets, reusable media assets.
- Anonymous session summary/history stored locally; share/export results only by choice.
- Phone-based participation, shared rooms, authenticated host permissions, moderation, server-authoritative state and reconnect behavior.
- Analytics and optional accounts; only when evidenced by demand and designed with privacy protections.

## 6. Proposed software architecture

**Pragmatic stack:** React + TypeScript + Vite; styling via centralized design tokens and reusable components. Static hosting on GitHub Pages or Cloudflare Pages for local-mode site. Start with client-side storage and same-origin BroadcastChannel; add a backend only for multi-device mode.

```text
src/
  app/               # routing, layout, catalog, navigation
  games/
    survey-showdown/ # manifest, schema, reducer, Host, Audience, Editor
    quickfire-quiz/  # manifest, schema, reducer, Host, Audience, Editor
    ...
  platform/
    catalog/         # compiled game registry, metadata, filters
    session/         # session lifecycle, actions, persistence, undo
    sync/            # same-device transport, spectator resync
    content/         # question pack schema, versioning, IO
    presentation/    # shared host and stage primitives
  components/        # buttons, inputs, modals, error handling
  styles/            # tokens, typography, responsive treatments
  i18n/              # interface strings (ID / EN)
  tests/             # unit, integration, browser, accessibility
```

**Game manifest contract** (illustrative, not currently implemented): `id`, `slug`, `version`, `title`, `categories`, `tags`, `description`, `capabilities`, `samplePack`, `packSchema`, `setupSchema`, `createInitialState`, `transition(state, action)`, `HostView`, `AudienceView`, `ContentEditor`. Prefer an explicit in-repo registry over arbitrary user-uploaded executable plugins for security and maintainability.

**Reusable core state objects:**
- `GameTemplate`: published, versioned game mechanic definition.
- `ContentPack`: authoring data + language, gameId, schemaVersion, optional provenance/rights metadata.
- `SessionConfig`: game-specific rules, teams, display and timing settings.
- `GameSession`: snapshot, sessionId, gameId, pack revision, status, timestamps, scores; no live link to mutable draft.
- `GameAction`: typed commands; `SessionEvent`: optional minimal event history for undo/audit where appropriate.

**State rules:** one authoritative host per local session; projector window is read-only; include a monotonically increasing revision in state messages, request snapshot on opening/reconnecting, and ignore stale revisions. Handle two host tabs safely (lock, warning, or explicit handover). Persist recoverable state with storage version/migrations; do not treat BroadcastChannel as durable persistence. Confirm backend choices separately when remote participation is actually in scope.

## 7. Architecture and quality gaps observed in v0.2

The current prototype already includes **Survey Showdown**, **Quickfire Quiz**, host/projector windows, local persistence, and a static offline-capable distribution. It has **not** yet delivered these platform capabilities:

- Game catalog, page routing, sample data and both engines still reside in one principal `src/main.jsx` module (approximately 367 lines; densely packed).
- Survey Showdown has a form-based editor; Quickfire Quiz currently uses a raw JSON question editor.
- Two games use separate storage keys, sync paths and gameplay state implementations; a shared session state abstraction is not yet proven.
- Same-origin windows in one browser profile sync; different devices do **not**.
- Data checks and smoke-render checks exist, but a broader cross-browser end-to-end, accessibility, large display and live event recovery suite remains necessary.
- Demo survey points are fictional; use provenance labels to avoid presenting them as real responses.

**Refactor with behavior preservation:** take regression screenshots/tests of existing games, then split modules and add reliable session invariants. Avoid a speculative plugin framework that forces all games into one mechanical rule system.

## 8. Delivery milestones and gates

### Milestone A — Product specification and baseline
**Deliver:** product brief, user journeys, catalog information model, current app audit, rules specifications for both games, issue tracker and repo setup.
**Gate:** no unclear claims about what exists; primary workflows and data semantics are documented.

### Milestone B — Foundation / architecture hardening
**Deliver:** TypeScript models, game registry, routes, platform shells, reducers/actions, persistence versioning, spectator-only window, state revision and resync, extracted game modules.
**Gate:** both existing games preserve scoring and answer reveal behavior; refresh/reopen recovery passes; static deploy works.

### Milestone C — Consistent content and session UX
**Deliver:** catalog game pages, game configuration wizard, visual editor for both games, versioned import/export, non-destructive draft/live separation, undo/confirmations, presenter instructions and rehearsal mode.
**Gate:** nontechnical host can start a customized session without changing JSON; content survives reload; accidental reset requires confirmation.

### Milestone D — Game quality and teaching usefulness
**Deliver:** timer options where appropriate, per-question explanations in trivia, reusable classroom/event packs, ID/EN UI, polished stage sound/animations with accessible alternatives, improved final results.
**Gate:** usable with no audio and no animation; all games support keyboard operation of critical actions; projector readability passes.

### Milestone E — Catalog expansion
**Deliver:** Quiz Board and Spin the Wheel as independent game modules using the shared platform. Their differences should prove extensibility.
**Gate:** adding a game doesn't require editing the core session logic or branching on a game ID throughout the application.

### Milestone F — Public portfolio release
**Deliver:** public demo, GitHub repository, changelog/releases, architecture diagram, short host+audience screencast, test evidence, release checklist, issue board and demo activity packs.
**Gate:** automated build/tests pass; game rehearsal succeeds under offline conditions; public documentation clearly states limitations.

### Milestone G — Optional remote multiplayer (separate decision)
**Deliver only if justified:** room creation, role permissions, realtime backend, authoritative server event handling, reconnection, abuse/rate controls, privacy/data retention.
**Gate:** cross-device scoring correct under concurrency and reconnect; room access controls tested. This milestone is **not** part of the initial MVP.

## 9. Test and acceptance plan

**Unit tests:** score calculations, strike/steal conditions, multiple scoring, timer boundaries, undo, duplicate IDs, import schema validity, state migration.

**Integration tests:** host actions update spectator state; projector never displays unrevealed answers; initial snapshot, stale revision rejection, refresh recoverability; safe content edit workflow.

**End-to-end:** play each game start-to-finish on desktop; second-monitor/projector simulations; keyboard shortcuts; browser reload; invalid import; offline replay; unsupported storage; sound denied; oversized content and long team names.

**Responsive/visual:** 360/390/768/1280 px catalog and host; projected display at 16:9 common resolutions (e.g., 1366×768 and 1920×1080); good contrast and readable typography from distance. Avoid assuming color or sound alone communicates correct/wrong states. Reduced-motion support.

**Real-world user test:** involve at least one lecturer/teacher and one event MC unfamiliar with the code; ask them to create content, launch a session, recover from a simulated mistake, and complete a game. Collect setup friction and incidents, not just satisfaction.

## 10. Nonfunctional, accessibility and IP requirements

- Static local-mode first; no secrets in the client bundle; protect future host/admin privileges in a backend, not just in UI.
- Local content backups and clear instructions to prevent accidental data loss from browser storage clears.
- Preserve control state even if display disconnects; show synchronization status on the host.
- No unnecessary user data collection. If accounts/phone participation arrive, state retention/consent controls explicitly.
- Only licensed or original artwork, icons, sound and font assets. Survey gameplay can draw inspiration from the genre, but avoid copying a TV show’s logo, graphics, trademarked branding, and exact commercial assets.
- Confirm final product name/domain/trademark separately before launching a formal brand.

## 11. GitHub / deployment / portfolio

**Repository:** `arifmuamardev/playlab-interactive-games` (proposed, not created here). Site can be served from GitHub Pages or Cloudflare Pages; brand/domain choice deferred. Build output must use correct relative paths on project hosting and ship a versioned service worker cache; test updates and cache invalidation.

**Portfolio evidence:** clear problem statement; architecture and scope; screenshots/gifs; technical decisions with tradeoffs; tests/CI; limitations; deployment; audience/host demonstration; roadmap and user feedback. Consider tagged milestones, issue tracker, conventional PR review/checks even when working solo, a license and third-party attribution.

**Success measures (early, not vanity):** median host setup steps/time from observed sessions, task-completion rate, zero session-losing defects during rehearsals, successful session restore after refresh, visual legibility, number of tested reusable packs, ability to add a third game without changing platform internals. Do not count planned game tiles as playable games.

## 12. Reference review when the MainPintar catalog arrives

Review it as product research without assuming its implementation: (1) full game taxonomy; (2) actual mechanics and customization; (3) preview and launch flow; (4) teacher and event usage; (5) host/projector/mobile roles; (6) free/paid restrictions; (7) accessibility, responsiveness, performance; (8) visuals and interaction patterns; (9) game data authoring/import; (10) strengths, weaknesses, and opportunities to differentiate.

For each candidate feature, classify **Adopt the concept / Differentiate / Defer / Avoid**, with a reason tied to users. Retain product-independent nomenclature, design, gameplay assets and content.

## 13. Immediate recommended backlog (ordered)

1. Record v0.2 baseline screenshots/tests and create `PRODUCT-SPEC.md` and `GAME-RULES.md` for both games.
2. Extract Survey and Quickfire into per-game modules without changing gameplay outputs.
3. Add a typed game registry and shared screen/session shell.
4. Implement host authority, projector resync and recoverable state versioning.
5. Separate content pack edits from live session progress.
6. Build consistent visual editor for Quickfire, and common import/export workflow.
7. Add catalog details and reusable setup/rehearsal flow.
8. Improve live MC safeguards, scores, winner state, projector controls and accessibility.
9. Build browser e2e suite, automate CI and rehearse with real projector.
10. Add **one** contrasting new game (Quiz Board or Spin the Wheel), then evaluate developer effort before adding the second.

## Decisions locked now / deferred

**Locked:** independent of PPI; host-led first; static/local first; two games to stabilize; reusable packs; modular engine; no mandatory logins; no backend for MVP; verify claims and mark sample data.

**Deferred:** final name/logo/domain, full game catalog and ordering, monetization, accounts, remote multiplayer, content-sharing service, AI features, third-party comparison, exact pricing, deployment URL.

---

This is a roadmap and specification, **not** a claim that all features are already implemented or deployed. Existing v0.2 baseline remains unchanged.
