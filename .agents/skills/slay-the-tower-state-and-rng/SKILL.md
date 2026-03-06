---
name: Slay the Tower State Management & RNG
description: Details the global Zustand application architecture and the Deterministic RNG implementation.
---

# State Management & RNG Overview

## Global Store (Zustand)
Slay the Tower utilizes `Zustand` as a monolithic global state container for the entire Run. Since standard React Context requires component wrapping and causes heavy re-rendering cascades, Zustand allows pure game logic functions (outside components) to mutate the `useGameStore`.

### State Sections
The Zustand store is distinctly segmented:
1. **Metagame / Run State:** Tracks the current floor, node ID, seed string, and houses the initialized `RNG` instance.
2. **Combat State:** The active transient board state. Houses HP arrays for `Player` and `Enemies`, active status effects, and temporary max block values.
3. **Deck State:** Contains arrays of Cards: `masterDeck`, `drawPile`, `hand`, `discardPile`, `exhaustPile`.
4. **Action Queue State:** The running sequencer track managing cascading game actions.
5. **Visual State:** Coordinates active ephemeral CSS animations (like combat numbers, card highlights, and target cursors) via the `activeAnimations` array. This slice manages the `playAnimation` cycle which automatically garbage collects entries after a `setTimeout` ticks down.

## Deterministic RNG
Roguelike games require the ability to perfectly recreate a run's seed. JavaScript's native `Math.random()` cannot be seeded natively in the browser.

### Implementation
We implement a lightweight PRNG (Pseudo-Random Number Generator) utilizing the `cyrb128` hashing function combined with a `mulberry32` 32-bit PRNG.

### Usage
- **Initialization:** Upon `initializeRun(seed)`, a new `RNG` instance is stored globally.
- **Retrieval:** All game logic functions (e.g. Map branching, Card drawing, Relic dropping) use `state.rng.next()` rather than `Math.random()`.
- **Card Shuffling:** Implementing a Fisher-Yates array shuffle using the determinisic RNG ensures card draw order is always the same for a seeded deck sequence.
