# Game Organizer — device setups

PlayLab supports two event topologies. Both game modules preserve their existing
manual scoring and non-enforced optional countdowns.

## Mode A: One laptop + projector (local / offline after cache)

1. On the presenting laptop open **Organize event → Mode A**.
2. Choose Survey Showdown or Quickfire Quiz; pick a set and team names.
3. Review the rules, optionally rehearse, then choose **Launch host controls**.
4. Choose **Open projector** and drag that window to the projector in **extended desktop mode**.
5. Keep the control screen on your laptop. Fullscreen the audience view.
6. Reveal/award from the laptop. If the audience window is open in the
   same browser profile, browser storage / BroadcastChannel keeps it in sync.

There is no cloud relay and no participant login in this mode. Rehearsal state is
isolated from real match state.

## Mode B: Display laptop + second controller (paired online room)

1. On the display laptop open **Organize event → Mode B**, choose the game.
2. Select content, name the teams, review rules, and **Create paired session**.
3. The organizer page supplies two different links:
   - **Audience display**: open on the laptop driving the projector. Read-only.
   - **Private controller**: send to the MC's phone, tablet, or second laptop.
4. On both screens wait until the session is connected. Control the game on
   the second device; its changes go through the room relay.
5. Audience display updates automatically. Refresh/reconnect retrieves the latest
   persisted session, including scores, reveals, active question and timer.
6. A room expires **12 hours after creation**. Create a new match for another
   event.

**Important boundaries:** Both devices require an internet connection.
The controller URL is a bearer credential: anyone who has it can control the room.
Only share it with your designated host. The projector link has a separate
read-only credential. Both credentials are kept in URL fragments and session
storage on the organizer tab, never copied into local/offline match keys. Remote
sessions are ephemeral and do not sync your local saved question-pack library.

### Operational safety

- Room creation is rate-limited to 24 requests per IP per hour by the relay.\n- Room state changes are accepted only from a valid controller token, validated
  and serialized server-side. Conflicting/outdated updates are rejected.
- The audience token is never authorized for writes.
- Disconnection shows a status screen, **not a fake offline demo board**.
- Room state persists in a Cloudflare Durable Object until the expiration alarm.
- Tokens and room state are never logged by application code.
- No accounts, participant-device pairing, buzzer control, or audio/video streaming.

### Run and deployment

The React site remains deployable to GitHub Pages with `npm run build`.
A separate Cloudflare Worker is required for paired mode:

```sh
cd workers
npx wrangler deploy
```

Source: `workers/worker.mjs`, config: `workers/wrangler.jsonc`.
Update `src/remote/session.js` if the deployed Worker hostname changes.
A worker outage affects Mode B only; Mode A remains independent.

Before using Mode B for an actual large event, test laptop-to-phone syncing,
network handover, expiry, and viewer-write rejection from **two physical devices**.
Public production scaling should also add a per-IP room-creation rate limit
and monitor abuse/costs; CORS is not a substitute for that server-side protection.
