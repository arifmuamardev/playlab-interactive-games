# PlayLab ready-to-play sets and rules

PlayLab has **two playable games**, each with **five complete built-in sets of eight prompts**. The sets are bundled with the application (no account, cloud service, or installation needed). They can be chosen in **Dashboard → Game Setup → Choose your questions → Ready-to-use classroom & event templates**.

## Included sets

| Game | Set | Audience | Suggested host-led duration |
|---|---|---|---|
| Survey Showdown | Classroom Icebreakers | Mixed groups | 20–30 minutes |
| Survey Showdown | Community Game Night | Mixed groups | 20–30 minutes |
| Survey Showdown | Family Fun & Celebrations | All ages | 20–30 minutes |
| Survey Showdown | Everyday Life Showdown | Teens & adults | 20–30 minutes |
| Survey Showdown | Travel & Culture Adventure | All ages | 20–30 minutes |
| Quickfire Quiz | Computing Fundamentals | Teens & adults | 10–20 minutes |
| Quickfire Quiz | General Knowledge Warm-up | Teens & adults | 10–20 minutes |
| Quickfire Quiz | Science & Nature Explorer | Teens & adults | 10–20 minutes |
| Quickfire Quiz | World, Travel & Culture | All ages | 10–20 minutes |
| Quickfire Quiz | Math & Logic Challenge | Teens & adults | 10–20 minutes |

These timings are planning suggestions. An **optional host-controlled 15/30/60/90-second countdown** is now available in both games, but it never automatically ends a turn or changes scores. The host can finish at any point.

## Survey Showdown rules

Two teams guess answers to eight survey-style prompts. The host reveals matching answers (keyboard 1–8), adding their listed points multiplied by the round's 1×, 2× or 3× multiplier to a **round bank**. The host can add a strike for an incorrect guess (X), or undo one (Z). Three strikes mark a **steal opportunity**; the host, not software, judges whether the other team succeeds. The host must explicitly award the bank to one team; awarding requires at least one revealed answer. The host may correct an award. Continue through rounds, finish explicitly, and view the final scoreboard; a tie is possible.

**Important:** All built-in Survey answers, rankings, and point values are **fictional game examples**, not real survey responses. Do not cite them as observed survey data. The supplied sets are for playful classroom and event use; replace answer sets with collected results if accurate survey methodology matters.

## Quickfire Quiz rules

Each question has four choices (A–D), one correct answer, and an explanation. The host reads or displays the question, allows teams to answer, then reveals the correct choice (R). **There is no automatic point award.** The host may award +10 points to a team or subtract 10 as a correction, and can undo the most recent score change (U). N/P move forward/back through questions. Hosts decide timing and which answers merit points; PlayLab does not enforce timers, buzzers, or a maximum of one award per question. Finish explicitly to show the winning team or a tie.

## Optional projector countdown

During a live question or round, use the host's **Countdown timer** card to start a 15, 30, 60, or 90-second countdown. Both screens display the remaining time using a local deadline, so a projector refresh or briefly backgrounded tab catches up without requiring a running network connection. Pause, resume, or clear at any point; selecting a preset restarts the countdown. The timer clears when a Quickfire answer is revealed, when Survey points are awarded, when the question/round changes, and on match finish/reset. It starts **off** for each question/round.

**The timer is a visual aid, not a rule engine.** Expiry never automatically reveals answers, awards points, adds strikes, or judges a steal. The host makes all decisions, even if the timer reaches zero.

## Playing, practice, and safety

- Set up teams, choose a built-in set, then **Practice without affecting live game** to rehearse.
- Opening a set in setup or viewing its preview **never changes** a live match or personal saved packs.
- Launching a new live match resets its scores and progress, **only after confirmation if an existing match is present**.
- Use the host and projector tabs in the **same browser profile and origin** for synchronization.
- Projector sound is **off by default** and requires an explicit click to enable it.
- **Finish** preserves scores and questions; **Reset & play again** is a separate, confirmed action.

## Content maintenance

Bundled sets live in `src/dashboard/starterTemplates.js` and `src/dashboard/readyToPlaySets.js`. All templates must pass Survey and Quickfire question validation and have eight prompts. The two original starter IDs for each game were preserved for compatibility. The catalog is shipped with the app, while user-created content packs remain independent in local browser storage.
