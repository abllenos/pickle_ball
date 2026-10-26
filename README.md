# Open Play

Pickleball Open Play run by the organizer: courts that never sit idle, fair playing time, spoken court calls and a venue TV display.
An installable PWA on React + TypeScript + Vite and Firebase Spark (free). Runs at zero cost.

> **Current state: works on one device.** A session is saved in this browser only
> (`src/store/sessionStore.ts`). Firebase is not called yet.
> Open `/display` in a second tab of the same browser and it follows the organizer tab live.

## The flow

1. **Start screen** (`/`): Start a session. While one is running: Continue, Open TV screen, End session.
2. **New session**: name, venue, rental hours, courts, score limit, matching. Then straight to Players.
3. **Players**: add each player as they arrive. With 4 or more, start the first games on Courts.
4. **Courts**: tap who won; the next four are called automatically.
5. **Session**: settings and speaker; End session returns to the start screen.

## How a session works

- **Organizer only.** There is no player app, so nobody can prank the queue. Players give their name at the desk.
- **Courts are rented by the hour.** Set the hours at the start or change them in Session. The app shows how
  much rental time is left. **Last call:** no new games start in the last 5 minutes (or 10/15, or off); the
  organizer can still start one by hand.
- **Courts never sit idle.** A game ends when a team reaches the score limit (11, 15 or 21). The organizer taps
  who won: the speaker announces the winners and the TV shows them for 10 seconds, then the next four are put on
  that court and called automatically. "Send now" skips the wait; "Hold" keeps the court open.
- **Fair play time.** The next four are whoever has played the fewest games, then whoever has waited longest.
  Nobody with fewer games is ever skipped, so games stay even (at most 2 apart for a moment when one court has a
  very long game). Late arrivals and players back from a break start level with whoever has played least.
- **Variety.** Same level or Balanced matching. Among fair choices, the app picks the best game and avoids repeat
  partners and opponents. The organizer can swap anyone into the Up Next four or ask for another option.
- **Speaker.** Calls each court change, Call again, and a test call, in English or Tagalog, with a Deep narrator
  or Standard voice. Calls queue up so two courts finishing together don't cut each other off.
- **TV.** Courts with game times, next in line, Top players with win counts, and the latest winners.

## Run it

```bash
npm install
npm run dev
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Type-check and production build (no source maps) |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | Lint (oxlint) |
| `npm run deploy` | Build and deploy to Firebase Hosting |

## Routes

| Path | Screen |
|---|---|
| `/` | Start screen: start, continue or end a session |
| `/organizer` | Courts: who won, call again, open courts |
| `/organizer/players` | Players: add, rest, remove, games and wins |
| `/organizer/up-next` | Up Next: the next four, swaps, waiting line, auto-fill |
| `/organizer/session` | Session: score limit, auto-fill, courts, rental, speaker |
| `/organizer/setup` | New session (no bottom nav) |
| `/display` | Venue TV (1920×1080, scales to any screen) |

## Hosting (all free)

| Part | Where |
|---|---|
| Frontend | Firebase Hosting (`openplay.web.app`) |
| Database | Cloud Firestore, Spark plan, region `asia-southeast1` (Singapore) |
| API | None. The app talks to Firestore directly; security rules allow writes from the organizer account only |

## Firebase setup (Spark plan, no card)

1. Create a project at console.firebase.google.com. **Do not upgrade to Blaze.**
2. Add a Web app and copy its config into `.env.local` (start from `.env.example`).
3. `npm i -g firebase-tools`, `firebase login`, then copy `.firebaserc.example` to `.firebaserc` and set your project id.
4. In Google Cloud Console, restrict the web API key to your hosting domain and set a budget alert.

`firestore.rules` denies everything until Milestone 7 adds the real rules.

## Folder structure

```
src/
  app/          router, React Query client
  components/   shared UI (one folder per component, with its own CSS)
  core/         pure logic with tests: matching (who plays next), announcer text, standings
  features/
    organizer/  layout + pages
    display/    venue TV
  lib/          speech, time helpers, Firebase init (not used yet)
  mocks/        sample speaker test call
  pages/        Home, NotFound
  store/        Zustand: session, announcer, device settings
  styles/       tokens.css (design tokens), base, layout, ui primitives
  types/        data model
```

## Rules for this codebase

- **No inline styles.** Every component styles itself from a dedicated `.css` file using the variables in `styles/tokens.css`.
- Touch targets are at least 44px. Primary buttons are 56px.
- Device-only settings (speaker, voice, language) stay in localStorage, never Firestore.

## Milestones

- [x] 6 · Starter project
- [x] 8 · Matching and announcer as pure modules with tests
- [x] 9 · Organizer screens (on the demo session)
- [x] 11 · TV display
- [ ] 7 · Firestore data layer, security rules (organizer-only writes), Auth, App Check
- [ ] 12 · PWA icons, offline shell, build protection
- [ ] 14 · Deploy and test a real session

The player app (old milestone 10) and player push alerts (13) were dropped: organizer-only.
