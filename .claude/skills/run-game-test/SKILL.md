---
name: run-game-test
description: >
  Run automated game testing. Plays through the full game loop from selfie
  submission through combat, rest, shop, and mystery events. Two modes:
  "victory" (complete all 10 floors and beat the boss) or "defeat" (intentionally
  lose mid-run around floor 5). Uses a Bob Ross test fixture photo as the selfie.
  Invoke with: /run-game-test victory OR /run-game-test defeat
allowed-tools: Bash(npm:*), Bash(node:*), Bash(lsof:*), Bash(kill:*)
---

# Automated Game Test Runner

Run a full game from selfie → character generation → 10 floors → victory/defeat.

Everything is driven by a self-contained Playwright harness at `tests/e2e.cjs` —
no MCP servers, no browser extensions, no manual setup. The harness boots the
vite dev server and the API server automatically if they aren't already running,
finds a Chromium binary on its own, and tears down anything it started.

## How to Run

```bash
npm run test:e2e -- victory     # full run, play to beat the floor-9 boss
npm run test:e2e -- defeat      # play until floor 5, then stop blocking and die
npm run test:e2e -- mechanics   # deterministic combat-engine checks only
npm run test:e2e                # all of the above (default)
```

If no argument was given to the skill, default to `victory`.

## What Each Mode Verifies

- **mechanics** — exact-value engine checks: turn-1 intent telegraphing;
  Burn/Spikes/Regen application, ticks, and decay; block math under multi-hit
  attacks; the pick-1-of-3 reward flow (claim adds card + banks gold);
  elite loot pre-upgraded with 50-80 gold; boss loot pre-upgraded with 90-130
  gold; boss-floor victory setting `isRunComplete` and rendering SPIRE CLEARED;
  corpse-targeting refusal.
- **victory** — a greedy combat AI plays a real run to the boss. Passes when
  the boss dies and the run ends on the SPIRE CLEARED screen.
- **defeat** — same AI stops playing cards from floor 5 and dies. Passes when
  `isGameOver` is set from floor >= 5 (the YOU DIED screen).

## Reading the Output

- Every assertion prints a `[PASS]`/`[FAIL]` line; the process exits non-zero
  if anything failed.
- Full-run modes log each floor (`Floor 3: Combat — HP 62/75`), each combat
  outcome with the loot taken, and a final summary line.
- Screenshots of the final screen land in `tests/.e2e-out/` (gitignored),
  along with `vite.log` / `server.log` for any servers the harness started.
- External font requests (fonts.googleapis.com) may fail in sandboxed
  environments; the harness filters those out — they are not product errors.

## Environment Knobs

| Variable | Purpose |
|----------|---------|
| `PW_CHROMIUM` | Path to a Chromium/Chrome binary if auto-detection fails |
| `E2E_BASE` | App URL when the dev server is already running elsewhere (default `http://localhost:5173`) |

Character generation uses the Bob Ross fixture at `tests/fixtures/bob_ross.jpg`
(falls back to a generated placeholder if missing). Without a `GEMINI_API_KEY`
in `server/.env`, generation uses the mock path — instant and deterministic
enough for testing. With a real key, expect 15-30s for that step.

## Reporting

After a run, report:
- Mode, and whether ALL CHECKS PASSED
- Character generated (name/archetype are in the log)
- Floors completed, final HP, gold, deck size
- Outcome (SPIRE CLEARED / died on floor N)
- Any `[FAIL]` lines verbatim, plus console errors the harness surfaced

## Store Debugging Reference

For ad-hoc investigation beyond the harness, the dev build exposes the Zustand
store as `window.__gameStore`:

- `getState()` / `setState()` — read or patch any state directly
- Key methods: `initializeRun(seed)`, `submitSelfie(dataUrl)`,
  `startGeneratedRun()`, `advanceFloor(node)`, `playCard(instanceId, targetId?)`,
  `endTurn()`, `claimCardReward(instanceId)`, `continueCombatResult()`
- Victory condition: `isRunComplete === true`; defeat: `isGameOver === true`
- Safe-to-act check during combat: `isPlayerTurn && !isResolving && actionQueue.length === 0`
