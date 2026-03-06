---
name: Slay the Tower Action Queue Engine
description: Documentation on the sequential Combat Engine and Action Queue system used in Slay the Tower.
---

# Slay the Tower Action Queue Engine

## Problem Statement
In procedural deck-builders, card effects frequently trigger a cascading chain of reactions. For example: Player attacks -> Enemy loses HP -> Enemy "Thorns" status triggers -> Player loses HP -> Player "On Damage taken" relic triggers -> Player gains Block. 

If this is handled with simple React state updates, it becomes visually impossible to animate and mechanically impossible to correctly track sequence. 

## The Action Queue Solution
The `GameStore` implements an `ActionQueue` using a discrete state machine list. 

### Game Actions
- `PLAY_CARD`
- `DAMAGE_ENTITY`
- `GAIN_BLOCK`
- `PLAY_ANIMATION` (Visual pacing)
- `DELAY` (Asynchronous pacing pauses)
- `ANNOUNCE_INTENT` (UI telegraphing)
- `START_TURN` / `END_TURN`

### Resolver Loop
When a card is played, its effects aren't instantly mathematically applied. Instead, it generates a list of `GameAction` objects that are pushed onto the queue.

The game polls the `resolveQueue()` function. This function processes the top action in the queue, applies its specific mathematical effects to the target entities, and then visually reflects those changes. Complex actions like `PLAY_CARD` simply unpack their resulting minor actions (like `DAMAGE_ENTITY`) and prepend them to the queue dynamically.

### Asynchronous Pacing
Crucially, the `resolveQueue` sequencer is **asynchronous**. It utilizes `setTimeout` loops internally when executing visual actions (`PLAY_ANIMATION` and `DELAY`). This allows the queue to artificially pause state resolution, ensuring a lunge animation plays visually for 400ms *before* the numerical `DAMAGE_ENTITY` math executes in the store, guaranteeing dramatic combat pacing.

### Interruption & Flow
This queue model allows Relics to safely inject `GameActions` to the front of the queue by listening to specific event triggers. Once the queue is entirely empty, the game returns control to the player.
