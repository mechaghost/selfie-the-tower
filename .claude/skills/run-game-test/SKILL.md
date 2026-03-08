---
name: run-game-test
description: >
  Run automated game testing. Plays through the full game loop from selfie
  submission through combat, rest, shop, and mystery events. Two modes:
  "victory" (complete all 10 floors and beat the boss) or "defeat" (intentionally
  lose mid-run around floor 5). Uses a Bob Ross test fixture photo as the selfie.
  Invoke with: /run-game-test victory OR /run-game-test defeat
allowed-tools: Bash(base64:*), Bash(lsof:*), Bash(cd:*), Bash(npm:*), Bash(kill:*), mcp__Claude_Preview__*
---

# Automated Game Test Runner

Run a full game from selfie → character generation → 10 floors → victory/defeat.

## Arguments

- `victory` — Play to win. Beat all floors including the boss.
- `defeat` — Play normally until floor 5, then intentionally lose combat.

If no argument given, default to `victory`.

## Prerequisites

1. **Vite dev server** must be running. Use `preview_start` with the `dev` config.
2. **Express server** must be running on port 3001. Check with `lsof -i :3001`. If not running: `cd /Users/taco/Documents/GitHub/slay-the-tower/server && npm run dev` (run in background).
3. **Test fixture** exists at `tests/fixtures/bob_ross.jpg`.

## Step 1: Ensure Test Image is Accessible

Copy the test fixture into the public folder so the browser can fetch it:

```bash
cp /Users/taco/Documents/GitHub/slay-the-tower/tests/fixtures/bob_ross.jpg /Users/taco/Documents/GitHub/slay-the-tower/public/assets/test_bob_ross.jpg
```

## Step 2: Clear State & Submit Selfie

Use `preview_eval` — the browser fetches the image and converts to base64 data URL internally (avoids preview_eval string size limits):

```javascript
(async () => {
    localStorage.removeItem('stt_run');
    const store = window.__gameStore;
    store.getState().abandonRun();
    await new Promise(r => setTimeout(r, 200));

    // Fetch test image and convert to data URL in-browser
    const resp = await fetch('/assets/test_bob_ross.jpg');
    const blob = await resp.blob();
    const dataUrl = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });

    await store.getState().submitSelfie(dataUrl);

    const s = store.getState();
    return {
        ugcPhase: s.ugcPhase,
        charName: s.generatedCharacter?.name,
        archetype: s.generatedCharacter?.archetype,
        cardCount: s.generatedCards?.length
    };
})();
```

**Poll** until `ugcPhase === 'reveal'`. If it's still `'generating'`, wait 3 seconds and check again (up to 60 seconds total for real Gemini calls).

Log: `Character: {name} ({archetype}), {cardCount} cards`

## Step 3: Start the Run

```javascript
(function() {
    const store = window.__gameStore;
    store.getState().startGeneratedRun();
    const s = store.getState();
    return {
        seed: s.seed,
        floor: s.floor,
        hp: s.player.hp + '/' + s.player.maxHp,
        gold: s.player.gold,
        deckSize: s.masterDeck.length
    };
})();
```

Log: `Run started — seed: {seed}, HP: {hp}, deck: {deckSize} cards, gold: {gold}`

## Step 4: Floor Loop

Repeat for floors 1 through 9 (or until `isGameOver`). For each floor:

### 4a. Navigate to Next Node

```javascript
(async () => {
    const { generateMap } = await import('/src/core/mapGenerator.ts');
    const store = window.__gameStore;
    const s = store.getState();
    const mapData = generateMap(s.seed);

    let available;
    if (s.currentNodeId === null) {
        // First move: pick from floor 1 nodes
        available = mapData.nodes.filter(n => n.y === 1);
    } else {
        const current = mapData.nodes.find(n => n.id === s.currentNodeId);
        available = mapData.nodes.filter(n => current.connections.includes(n.id));
    }

    if (!available || available.length === 0) {
        return { error: 'No available nodes', floor: s.floor, currentNodeId: s.currentNodeId };
    }

    // Node selection priority
    const hpPct = s.player.hp / s.player.maxHp;
    const priority = hpPct < 0.5
        ? ['Rest', 'Combat', 'Shop', 'Unknown', 'Elite', 'Boss']
        : ['Combat', 'Shop', 'Unknown', 'Rest', 'Elite', 'Boss'];

    let chosen = null;
    for (const type of priority) {
        chosen = available.find(n => n.type === type);
        if (chosen) break;
    }
    if (!chosen) chosen = available[0];

    store.getState().advanceFloor(chosen);

    const after = store.getState();
    return {
        floor: after.floor,
        nodeType: chosen.type,
        nodeId: chosen.id,
        inCombat: after.inCombat,
        nodeEvent: after.nodeEvent,
        hp: after.player.hp + '/' + after.player.maxHp
    };
})();
```

Log: `Floor {floor}: {nodeType} — HP: {hp}`

### 4b. Handle Node by Type

#### Combat / Elite / Boss

Inject the combat AI. Set `window.__TEST_THROW = true` if this is **defeat mode AND floor >= 5**.

```javascript
(function() {
    // Clean up any previous AI
    if (window.__combatAI) clearInterval(window.__combatAI);

    function cardScore(card, player) {
        let score = 0;
        const hpPct = player.hp / player.maxHp;
        for (const e of card.effects) {
            if (e.type === 'Damage') score += (e.amount || 0) * 2;
            if (e.type === 'Block') score += (e.amount || 0) * (hpPct < 0.4 ? 3 : 1);
            if (e.type === 'ApplyStatus' && e.statusId === 'vulnerable') score += 8;
            if (e.type === 'ApplyStatus' && e.statusId === 'weak') score += 6;
            if (e.type === 'ApplyStatus' && (e.statusId === 'strength' || e.statusId === 'dexterity')) score += 10;
            if (e.type === 'Draw') score += (e.amount || 0) * 3;
            if (e.type === 'Heal') score += (e.amount || 0) * (hpPct < 0.5 ? 4 : 1);
        }
        if (card.cost === 0) score += 5;
        if (card.isHeroCard) score += 15;
        return score;
    }

    window.__combatAI = setInterval(() => {
        const store = window.__gameStore;
        const s = store.getState();

        // Stop conditions
        if (!s.inCombat || s.combatResult) {
            clearInterval(window.__combatAI);
            window.__combatAI = null;
            return;
        }

        // Only act when it's safe
        if (!s.isPlayerTurn || s.isResolving || s.actionQueue.length > 0) return;

        // Defeat mode: just end turn
        if (window.__TEST_THROW) {
            store.getState().endTurn();
            return;
        }

        const enemies = s.enemies.filter(e => e.hp > 0);
        if (enemies.length === 0) return;

        // Find best playable card
        const playable = s.hand
            .filter(c => c.cost <= s.player.energy)
            .sort((a, b) => cardScore(b, s.player) - cardScore(a, s.player));

        if (playable.length === 0) {
            store.getState().endTurn();
            return;
        }

        const card = playable[0];
        let targetId = undefined;
        if (card.target === 'Enemy') {
            targetId = enemies.sort((a, b) => a.hp - b.hp)[0].id;
        }
        store.getState().playCard(card.instanceId, targetId);
    }, 300);

    return 'Combat AI injected';
})();
```

Then **poll** every 3 seconds until combat resolves:

```javascript
(function() {
    const s = window.__gameStore.getState();
    return {
        inCombat: s.inCombat,
        combatResult: s.combatResult,
        isGameOver: s.isGameOver,
        hp: s.player.hp + '/' + s.player.maxHp,
        enemiesAlive: s.enemies.filter(e => e.hp > 0).length
    };
})();
```

When `combatResult` is set (or `isGameOver` is true):

```javascript
(function() {
    const store = window.__gameStore;
    const s = store.getState();
    const result = s.combatResult;
    const hp = s.player.hp + '/' + s.player.maxHp;
    const gold = s.player.gold;

    if (s.combatResult) {
        store.getState().continueCombatResult();
    }

    return { result, hp, gold, isGameOver: store.getState().isGameOver };
})();
```

Log: `Combat {result} — HP: {hp}, Gold: {gold}`

If `isGameOver` is true, stop the loop (defeat scenario complete).

#### Rest

```javascript
(function() {
    const store = window.__gameStore;
    store.getState().restHeal();
    const s = store.getState();
    return { hp: s.player.hp + '/' + s.player.maxHp };
})();
```

Log: `Rested — HP: {hp}`

#### Shop

```javascript
(function() {
    window.__gameStore.getState().dismissNodeEvent();
    return 'Shop skipped';
})();
```

#### Mystery

```javascript
(function() {
    const store = window.__gameStore;
    const s = store.getState();
    const event = s.currentEvent;
    if (!event) return { error: 'No event found' };

    // Pick first choice without a condition (safest)
    const choice = event.choices.find(c => !c.condition) || event.choices[0];
    store.getState().chooseEventOption(choice.id);

    // Dismiss after outcome
    const after = store.getState();
    const outcome = after.eventOutcome;
    store.getState().dismissNodeEvent();

    return { event: event.title, choice: choice.label, outcome };
})();
```

Log: `Mystery: {event.title} — chose "{choice.label}" → {outcome}`

## Step 5: Final Report

After the loop ends:

**Victory**: The boss fight is on floor 9. After `continueCombatResult()`, `isGameOver` stays `false` — the game just returns to the map with no more nodes. This is expected. The victory condition is: boss combat result was `'victory'` and floor is 9.

**Defeat**: `isGameOver` is set to `true` after `continueCombatResult()` on a defeat. The "YOU DIED" screen shows the floor reached.

1. **Screenshot** the final game state via `preview_screenshot`
2. **Check console** for errors via `preview_console_logs` (level: error)
3. **Report summary**:
   - Mode: victory or defeat
   - Floors completed
   - Final HP
   - Outcome (boss defeated / died on floor N)
   - Any errors encountered

## Defeat Mode Setup

Before starting the floor loop, if mode is `defeat`:

```javascript
window.__TEST_THROW = false; // Will be set to true on floor 5
```

On floor 5 (or the next combat after floor 5), before injecting the combat AI:

```javascript
window.__TEST_THROW = true;
```

The combat AI checks `window.__TEST_THROW` and just calls `endTurn()` without playing cards.

## Performance Optimization

For efficiency, you can combine all floor navigation + combat into a single `preview_eval` call with an async loop instead of doing each floor separately. Use 200ms combat AI intervals and 300ms delays between floors.

## Timing Notes

- **Character generation**: 1-2 seconds with mock (no API key), 15-30 seconds with Gemini
- **Combat**: ~5-15 seconds per combat (AI plays at 200ms intervals, queue resolves with delays)
- **Total victory run**: ~30-60 seconds when using a single eval loop
- **Poll interval**: Check combat state every 3 seconds (or use in-eval polling at 200ms)
- **Max wait per combat**: 60 seconds (if exceeded, something is stuck — screenshot and report)
