# Art Style Guide — Selfie the Spire

## Visual Identity

**Style**: Clean minimalist risograph print illustration
**Tone**: 1980s neon-soaked urban magic — bold, graphic, iconic

## Art Direction

- Flat color blocking in 2-3 solid ink layers
- Bold geometric shapes and forms
- Sparse hatching only for shading — large areas of clean flat color
- No grain, no noise, no halftone dots
- Sharp edges, high contrast, simple iconic forms
- Inspired by modern risograph poster art and screen print minimalism
- Dark backgrounds with neon-accent color palettes

## Prompt Template (for Gemini image generation)

```
Clean minimalist risograph print illustration. Flat color blocking in 2-3 solid ink layers, bold geometric shapes. Sparse hatching only for shading — large areas of clean flat color. No grain, no noise, no halftone dots. Sharp edges, high contrast, simple iconic forms. Inspired by modern risograph poster art and screen print minimalism. IMPORTANT: Full bleed artwork — the illustration must extend to every edge of the image. No white borders, no margins, no frames, no matte, no padding. Edge-to-edge color.
```

## Color Palettes by Archetype

| Archetype | Palette |
|-----------|---------|
| **Neon** | Vermillion red, hot orange, molten amber, neon pink |
| **Chrome** | Teal, electric cyan, silver chrome, deep navy |
| **Volt** | Electric violet, neon yellow, white lightning, deep purple |
| **Concrete** | Olive green, terracotta brown, warm amber, moss |
| **Smoke** | Deep purple, lavender mist, ghostly white, charcoal |

## CSS Design Tokens

All UI styling uses these CSS custom properties defined in `src/index.css`:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-base` | `#0d0d1a` | Page background |
| `--color-bg-surface` | `#1a1a2e` | Card/panel surfaces |
| `--color-bg-elevated` | `#252540` | Elevated panels, modals |
| `--color-accent-red` | `#ff3860` | Neon archetype, HP, damage |
| `--color-accent-blue` | `#00d4ff` | Chrome archetype, block, shield |
| `--color-accent-green` | `#39ff14` | Smoke archetype, heal, buff |
| `--color-accent-amber` | `#ffb347` | Gold, shop prices, concrete |
| `--color-accent-violet` | `#b967ff` | Volt archetype, mystery events |
| `--font-family-base` | `'Space Mono', monospace` | Body text |
| `--font-family-display` | `'Bebas Neue', sans-serif` | Headings, titles |

## Image Specifications

All runtime-generated images are optimized server-side via `sharp` before sending to client:

| Asset Type | Dimensions | Format | Aspect Ratio |
|------------|-----------|--------|--------------|
| Character portrait | 512 x 512 | WebP (quality 80) | 1:1 |
| Card art | 384 x 288 | WebP (quality 80) | 4:3 |
| Hero card art | 384 x 288 | WebP (quality 80) | 4:3 |
| Enemy portrait (static) | ~512 x 512 | PNG | 1:1 |
| Icons (80s memorabilia) | ~256 x 256 | PNG | 1:1 |

## Screen Theming

Each game screen has a distinct visual atmosphere:

| Screen | Theme | Key Colors |
|--------|-------|------------|
| **Combat** | Dark arena, particle effects | Red damage, cyan block, violet energy |
| **Map** | Dark grid with glowing node icons | Green paths, colored node types |
| **Rest Site** | Warm campfire glow | Amber/orange warmth, `#ff6b35` fire tones |
| **Shop** | Neon bazaar / marketplace | Cyan neon, amber gold prices, `#00d4ff` accents |
| **Mystery Event** | Eerie violet atmosphere | Deep purple `#b967ff`, mysterious glow |
| **Landing Page** | Hero showcase, scrolling sections | Full palette showcase, gradient backgrounds |

## Application

Use this style for:
- **Card art**: 4:3 landscape, centered iconic composition, no text/letters
- **Enemy portraits**: 1:1 square, single creature centered, dark background
- **Character portraits**: 1:1 square, upper body, archetype color palette
- **Icons**: 1:1 square, single object on solid black background (for bg removal)
- **Website styling**: Flat color blocking, geometric shapes, neon accents on dark backgrounds
- **UI elements**: Sharp edges, high contrast, minimal decoration, use CSS design tokens
- **Node event screens**: Match the screen theme above, use gradients and glows sparingly
- **Copy/voice**: Bold, punchy, uppercase display text — matches the graphic directness of the art
