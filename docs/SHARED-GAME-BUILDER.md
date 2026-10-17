# Shared Game Builder UI contract

PlayLab uses **one editor shell** across Survey Showdown and Quickfire Quiz.

## Shared primitives

`src/components/QuestionBuilder.jsx` exports:

- `useQuestionDraft(questions)`: immutable, local draft editing with selected-question index and validation error state; does not change a match until the game-specific save action is invoked.
- `QuestionBuilder`: the editor modal, accessible title/close button, question navigation/list, add-question trigger, save/cancel actions, and inline errors.

Each game still owns **question-specific fields** (Survey: 2–8 text/point answers and a 1–3× multiplier; Quickfire: four options, correct-answer index, explanation and optional JSON import). Both reuse the same list navigation, draft protection and confirmation boundaries.

## Safety and compatibility

- Existing host URL/query contracts, question pack schema, session keys and projector sync are unchanged.
- The editor validates through the existing game-specific normalization functions.
- Survey's existing save/reset behavior is preserved; Quickfire retains its explicit destructive confirmation before replacing a match.
- The shared shell and forms are tested in real Chromium at the host and projector level.
- This is an architectural step, not yet a cross-game question-schema converter. Survey and Quickfire packs remain incompatible by design.
