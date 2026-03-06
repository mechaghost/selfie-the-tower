---
name: Slay the Tower AI Data Architecture
description: Constraints for building LLM-Driven generative game mechanics via pure universal `Effect` arrays rather than bespoke engine code.
---

# Slay the Tower AI Data Architecture

The user intends for **Slay the Tower** to eventually be a completely dynamic UGC roguelike engine. A player can upload a selfie, and an LLM will parse the aesthetic to generate custom Cards, specific Enemy types, and tailored Node Runs. 

Because the game content will be generated dynamically over APIs at runtime, **the engine cannot be hardcoded to know about specific objects.** Adding a new mechanic must NEVER require writing a new `case 'MY_NEW_CARD':` inside `gameStore.ts`.

## Core Philosophy: The Universal Effect Pipeline

All gameplay interactions must be boiled down into serialized, atomic JSON `Effect` pipelines.

**Models** (`src/core/models.ts`):
```typescript
export type EffectType = 'Damage' | 'Block' | 'ApplyStatus' | 'Heal' | 'Draw' | 'Discard' | 'Exhaust';

export interface Effect {
    type: EffectType;
    amount?: number;
    statusId?: string; // 'vulnerable', 'weak', 'strength'
    target: 'Self' | 'Target' | 'AllEnemies' | 'RandomEnemy' | 'None';
    vfx?: string; // e.g. 'slash', 'fireball', 'heal_sparkle'
}
```

### 1. Generating Cards
When an AI (or internally generated user) creates a new Card, they must not write an execution function for it. They must define its behavior entirely through `Effect` arrays.

**BAD (Hardcoded Execution):**
```typescript
if (card.id === 'ai_generated_laser') {
    state.enemies.forEach(e => e.hp -= 20);
}
```

**GOOD (Data-Driven Effects):**
```json
{
    "id": "ai_generated_laser",
    "name": "Orbital Laser",
    "type": "Attack",
    "effects": [
        { "type": "Damage", "amount": 20, "target": "AllEnemies" }
    ]
}
```
The Game Engine parses `effects` and recursively fires `GameActions` independently.

### 2. Generating Enemies
Enemy templates (`src/data/enemies.ts`) use an `aiLogic` function that strictly returns an `EnemyIntent`. The Intent MUST bundle the generic `Effect[]` that it intends to resolve at the end of the round. 

**DO NOT** mutate `state.player.hp` inside the AI function. The AI only *telegraphs* the JSON intent. The Action Queue handles generic unwrapping.

```typescript
// AI Intent Builder (Data Layer)
return {
    type: 'AttackDebuff',
    damage: 8,
    effects: [
        { type: 'Damage', amount: 8, target: 'Target' },
        { type: 'ApplyStatus', amount: 1, statusId: 'weak', target: 'Target' }
    ]
}
```

## Maintenance & Refactoring
If a new LLM-generated custom card requires a mechanic that doesn't exist (e.g. "Steal Gold from Enemy"), **DO NOT** write card-specific execution code.

Instead:
1. Add `'StealGold'` to `EffectType` in `models.ts`.
2. Add a `case 'StealGold':` parsing block inside the universal `resolveEffects` utility in `gameStore.ts`.
3. The LLM can now confidently attach `{ "type": "StealGold", "amount": 10, "vfx": "gold_shower" }` to thousands of dynamically generated UGC cards forever.

### 3. Generating Visual Effects (VFX)
Visual animations are also inherently data-driven. When an LLM generates a custom attack, it does not need to write CSS or Javascript animation hooks. It simply passes a `vfx: 'laser_beam'` string on the Effect, and the Action Queue automatically translates this into visual `PLAY_ANIMATION` state nodes that the UI consumes.
