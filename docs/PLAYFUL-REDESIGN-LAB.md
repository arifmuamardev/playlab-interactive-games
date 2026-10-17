# PlayLab playful redesign — Design Lab V1

## Why

The existing PlayLab homepage and dashboard use restrained editorial visual styling. The next visual direction is **playful game-show energy**, inspired by the user's MainPintar reference, while preserving an accessible professional toolkit for university classes and community events.

**Important:** The exact current layout of MainPintar could not be inspected automatically. This design is an independent interpretation, not a recreation of that site's graphics or brand.

## Preview routes (hidden)

- Catalog concept: `?page=design-lab`
- Dashboard concept: `?page=design-lab&screen=dashboard`
- Current production homepage: `./`
- Current working dashboard: `?page=dashboard`

The new routes deliberately render different components under the `.playful-lab` root. The entire new CSS is scoped to it, so the current catalog, real dashboard, host controls, live scores, projector pages and local storage are untouched.

## Visual direction

- Warm cream page and lilac hero panel, bright coral, yellow, mint and violet accents
- Rounded, outlined game cards with gameplay illustrations (not stock photos)
- Bold, friendly headlines; high-contrast buttons; oversized visual affordances
- Playful microcopy suitable for adults and students, rather than cartoon-only children's branding
- Dashboard concept reuses **actual** browser-local saved match / question pack counts
- Small screens wrap into a single-column game shelf and accessible dashboard cards
- Motion on hover only; reduced-motion preference respected

## Approval gate

Before replacing production appearance, request feedback on catalog and dashboard concepts. After approval, migrate the relevant styling and components to the actual working UI in incremental PRs, then complete a visual review of Survey/Quickfire host/projector screens. Do not silently switch production.

## Quality checks

- The design lab has its own Chromium navigation and 360/390/768/1280 px overflow tests.
- Existing host, catalog and working dashboard routes remain independently verified.
- No new dependencies, backend tables or third-party media.
