# PlayLab modular architecture — milestone 1

## Scope

This refactor isolates the game catalog, presentation components, two game modules, and local-first synchronization without changing the existing URL contract or demo content.

| Module | Responsibility |
|---|---|
| `src/main.jsx` | Game module routing and service-worker registration |
| `src/GameHub.jsx` | Catalog landing UI |
| `src/core/gameRegistry.js` | Catalog metadata, including planned games |
| `src/core/useSyncedSession.js` | Local storage + BroadcastChannel host/projector state |
| `src/components/shared.jsx` | Shared branding and host controls |
| `src/games/survey/index.jsx` | Survey host/display/editor and round mechanics |
| `src/data.js` | Existing survey sample data and pure scoring/validation functions |
| `src/games/quickfire/index.jsx` | Quickfire host/display/editor |
| `src/games/quickfire/data.js` | Trivia sample data, score updates, question validation |

## Preserved behavior

- `/?game=survey` and `/?game=quickfire` continue to open the appropriate host.
- `&view=display` continues to open the audience board for that game.
- Existing `localStorage` keys are unchanged to preserve previous saves.
- On one origin, two windows in the same browser profile communicate via BroadcastChannel or the browser's storage event.
- Export/import content and sample data remain local. Survey values are examples, **not actual polling data**.

## Limits and safety

- Cross-device multiplayer, authentication, shared host ownership, and conflict-free concurrent writes are **not** implemented.
- One MC should control the match. Projector windows are viewers by convention; there is no remote authorization layer.
- Existing prebuilt `dist/` files remain a historical v0.2 snapshot; GitHub Actions compiles source on each change before Pages publication.
- Do not label this refactor production-ready without an actual same-profile, two-window projector rehearsal.

## Quality gates

1. `npm test`: survey math, catalog, Quickfire validation and scores.
2. `npm run build`: Vite validates JSX/import graph and compiles output.
3. GitHub Actions: verify and build for PR, deploy only from main.
4. Manual rehearsal: host and projector synchronization, reveals, steals, scores, reset, fullscreen, cache upgrades and offline refresh.

## Next steps

Introduce typed game module interfaces, verified game-specific state validation, browser automation, and cross-tab conflict controls before adding new game formats.
