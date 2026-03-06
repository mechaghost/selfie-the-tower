---
name: Slay the Tower Map Generation
description: Architectural guidelines and constraints for the Slay the Tower procedural map graph generator.
---

# Slay the Tower Map Generation Architecture

## Overview
The procedural map generator ensures a strictly traversable, visually appealing tree structure (similar to Slay the Spire) using deterministic RNG.

## Structural Constraints
1. **Grid Dimensions:** The map scales effectively to a 4-column by 10-row grid, though coordinates are stored as floating-point percentages so the UI can scale infinitely.
2. **Floor 0 (Start):** The first level randomly generates between **2 to 4 starting nodes**, restricting initial choices and forming the base of the branching paths.
3. **Floor 8 (Rest Sites):** The penultimate floor is hardcoded to generate **only Rest Sites (Campfires)** to ensure players always have an opportunity to heal or upgrade before the boss.
4. **Floor 9 (The Boss):** The absolute top of the map is a **single Boss** encounter, centered at `x: 0.5`.

## Pathing & Connection Rules
- **Forward Progression:** Nodes only connect to the layer directly above them.
- **Crossing Prevention:** The `checkForCrossing()` mathematical check prevents paths from overlapping visually. Left-to-right processing checks if `childX` crosses another node's trajectory.
- **Fair Connection Retries:** When generating connections, possible horizontal jumps (`dx`) must be shuffled. If a connection fails the crossing check, it retries alternative horizontal jumps instead of instantly "dying" and choking out a branch.
- **25% Distance Limit:** To avoid visually unpleasant, long sweeping lines, nodes are restricted from bridging to a node that exceeds approximately 32% horizontal distance (25% strict column width + 3% visual jitter leniency).

## Pruning Orphan & Dead Ends
After generation, the algorithm does a dual-pass graph traversal:
1. **Forward Pass:** Identifies all nodes reachable from the starting row.
2. **Backward Pass:** Identifies all nodes that ultimately connect to the Boss.
Only valid nodes that satisfy both conditions are preserved, meaning the player can never hit a dead end.

## Encounters Integration
The Map Generator **does not** instantiate physical Enemy arrays. When a `Monster` or `Elite` node is generated, the algorithm randomly pulls a string `encounterId` from the registry pools defined in `src/data/encounters.ts` and saves it to the node. 
Only when the player actually clicks the node does the Game Engine's `advanceFloor` logic lookup the Encounter ID and instantiate the distinct enemies.
