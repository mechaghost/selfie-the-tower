---
description: Documentation governing the visual layout, structural CSS, and UX positioning patterns for the Slay the Tower Combat engine.
---

# Slay the Tower Combat Layout & Game Mechanics

This document establishes the rigid layout conventions, rendering rules, and grid architecture for the `CombatView.tsx` screen. The UI is designed entirely around a **Mobile Portrait constraint**, prioritizing bottom-weighted usability for card management and dragging.

## 1. Top Navigation Bar (The Header)
- **Positioning**: Fixed absolutely to the top of the screen (`top: 0`).
- **Function**: Purely informational. Displays high-level Run statistics that do not impact immediate battle math.
- **Content Requirements**: 
  - Floor number
  - Total Gold
  - Future Relic displays
- **Constraint**: Must *never* overlap the Combat Area entities. The combat container must maintain a `top` offset sufficient to securely clear this element.

## 2. The Combat Stage (4-Row Vertical Grid)
The battlefield abandons legacy "side-by-side" rendering in favor of a 4-tier CSS flexbox column.
- **Orientation**: `flex-direction: column`.
- **Row 1 (Top)**: Player Character. Pinned horizontally center. This pushes the player physically away from the interaction zone, forcing combat to mathematically "reach up".
- **Row 2 (Divider)**: A horizontal visual gradient sweeping left-to-right to separate the Player territory from the Enemy territory.
- **Rows 3 & 4 (Enemies)**: The Enemy squad spawns beneath the divider line, stacked closely to the bottom interaction zone.

### Enemy Grid Rules
Enemies are constrained into a strict multi-row block via `flex-wrap: wrap-reverse` and `justify-content: center`.
- **Bottom-Heavy Population**: The `wrap-reverse` behavior forces new enemies to populate the bottom-most flex row *first*. This guarantees that enemies remain physically adjacent to the player's Hand HUD.
- **Max Width Caps**: The container width is capped so a maximum of 2 enemies can realistically share a horizontal line (e.g., forming a 2x2 square or 1x4 column based on spawn count).
- **Gutter Separation**: A massive vertical `gap` (e.g., `6rem`) must be maintained between enemy rows so their floating Intent Badges mathematically cannot overlap the health bars of units above them.

## 3. Deck Table & Hand Controls (The Interaction Zone)
- **Positioning**: Fixed entirely flat to `bottom: 0`. Rendered with a distinct dark linear-gradient `deck-table` class to represent physical table space.
- **HandHUD**: The primary interface. Cards are stacked radially in a fanned arc originating from the bottom-center of the screen.
- **Card Interaction**: Dragging cards works bottom-to-top. Because the Player is anchored at the ceiling while Enemies spawn heavily toward the bottom rows, users can easily target enemies with short, convenient swipe arcs without stretching to the top nav.

## 4. Draw & Discard Piles (Void Mechanics)
- **Visuals**: Standard box visuals for the Draw/Discard piles are obsolete. They do not render backgrounds, borders, or deck boxes.
- **Geometry**: The "Origins" of the Draw/Discard mechanics are pinned using absolute CSS coordinates directly onto the left and right rims of the Deck Table surface.
- **Counters**: The card counts are pure whitespace text featuring heavy contrasting `text-shadows`, planted squarely over the mathematical Void coordinates.
- **Animations**: Card entry/exit animations mathematically `translate()` to/from these rim coordinates (`left: 4rem` and `right: 4rem`).
  - **Drawing**: Cards originate from the off-screen left void (`opacity: 0`, `scale: 0`), sweeping inward before fanning.
  - **Discarding**: Cards sweep right into the right void, scaling down perfectly to `0` exactly over the text coordinates.
