---
name: Slay the Tower Card Architecture
description: Documentation on the Card data models, UI component structure, and reusability of the Card UI in Slay the Tower.
---

# Slay the Tower Card Architecture

## Overview
The card system in Slay the Tower is broken down into three distinct layers to ensure optimal reusability and clean separation of concerns:
1. **The Core Data Model:** The strict mathematical definition of a card.
2. **The Content Database:** The static registry of all available cards.
3. **The UI Component (`CardItem`):** The isolated, visual React representation of a card.

## 1. The Core Data Model (`src/core/models.ts`)
Every card follows the strict `Card` interface. This ensures the game engine can process them uniformly without needing to know anything about their visual representation.

```typescript
export interface Card {
    id: string;          // Generic template ID (e.g., 'strike_red')
    instanceId: string;  // Unique ID for this specific physical copy in the deck
    name: string;        // Localized name ('Strike')
    type: CardType;      // 'Attack' | 'Skill' | 'Power' | 'Status' | 'Curse'
    cost: number;        // Energy cost
    description: string; // Effect text
    target: TargetType;  // 'Enemy' | 'Self' | 'AllEnemies' | 'None'
    imageId?: string;    // Reference to public/assets/cards/
    exhausts?: boolean;
    ethereal?: boolean;
    upgraded?: boolean;
}
```

## 2. The Content Database (`src/data/cards.ts`)
Cards are instantiated dynamically from a static `CARD_DATABASE` dictionary. When a new run starts or a player drafts a card, the `createCardInstance(cardId)` helper copies the template and assigns it a unique `instanceId`. 

This unique ID is crucial because a player might have 5 copies of "Strike" in their deck, and React needs to track each distinct physical DOM node individually during hand shuffling and drag animations.

Action resolution is tied to the template `id` via `resolveCardPlay()`.

## 3. The UI Component (`CardItem.tsx`)
The visual representation of a card has been heavily abstracted into a standalone, highly reusable React component (`src/components/ui/CardItem.tsx`).

### Props & Reusability
Because `CardItem` is cleanly decoupled from the `HandHUD` map loop, it can be dropped seamlessly into any context (Draft Rewards, Merchant Shop, Character View, Discard Pile) by simply passing the raw `Card` object.

```typescript
interface CardItemProps {
    card: Card;                  // The raw data model to render
    style?: React.CSSProperties; // Allowing the parent to control layout/transforms
    canPlay?: boolean;           // Determines hover state and grayscale styling
    isDraggable?: boolean;       // Toggles drag-and-drop HTML5 events
}
```

### Visual Components
- **Card Type Borders:** The CSS dynamically colors the outer border of the `CardItem` based on `type` (e.g., `.type-attack` is red).
- **Energy Cost:** Displayed cleanly in the top left corner.
- **Targeting Badges:** Automatically rendered in the top right based on the `target` property (utilizing `Crosshair`, `Users`, or `User` icons from `lucide-react`).
- **Artwork Container (`.card-artwork`):** Maps to `card.imageId` to render a fixed `3:2` aspect ratio image, nestled between the sub-header and description text.

### Drag and Drop Architecture
When `isDraggable` is true, HTML5 Drag Events are attached directly to the `CardItem`. 
If a card targets a specific `Enemy`, the native ghost drag image is suppressed, and coordinates are continuously pushed to the global Zustand `GameStore`, which drives a Bezier curve targeting arrow in `CombatView.tsx`.

### Animation Trajectories
Cards entering or leaving the Hand HUD mathematically transition from the invisible Draw/Discard bounds defined by `CombatView`. 
The CSS keyframes (`flyFromDrawPile` and `flyToDiscard`) explicitly map to the absolute rim coordinates of the Deck Table using `calc(50vw - 84px)` for X, and sink the card's `scale` down to `0` to visually pull them into the voids.
