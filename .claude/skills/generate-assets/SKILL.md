# Local Asset Generation — AI Image Studio

Generate game assets (icons, items, transparent sprites, card art, etc.) via the local AI Image Studio API. This is for **development-time asset creation only** — the server runs locally and is not available in production.

## API Base URL

```
http://127.0.0.1:43211
```

## Endpoints

### 1. Image Generation — `POST /api/v1/generate`

Synthesize new images from text prompts.

- **Content-Type**: `multipart/form-data`
- **Parameters**:
  | Param | Type | Required | Description |
  |-------|------|----------|-------------|
  | `prompt` | string | Yes | Detailed description of the image to generate |
  | `model` | string | No | Model variant (see below) |
  | `aspect_ratio` | string | No | `1:1` (default), `3:4`, `4:3`, `9:16`, `16:9` |
  | `file` | binary | No | Base image for image-to-image generation |

- **Models**:
  - `imagen-4.0-generate-001` — Standard quality, balanced (default)
  - `imagen-4.0-fast-generate-001` — Fast drafts
  - `imagen-4.0-ultra-generate-001` — Maximum quality, photorealism

- **Response**: Raw PNG image bytes

### 2. Background Removal — `POST /api/v1/process`

Remove background and trim transparent bounds tightly to the subject.

- **Content-Type**: `multipart/form-data`
- **Parameters**:
  | Param | Type | Required | Description |
  |-------|------|----------|-------------|
  | `file` | binary | Yes | The image to process |

- **Response**: Raw PNG image bytes with transparent background

## Workflow

### Transparent Asset (icons, items, sprites)

Always a **two-step process**:

1. **Generate** the image via `/api/v1/generate`
2. **Process** the result via `/api/v1/process` to strip the background

### Opaque Asset (card art, backgrounds, portraits)

Single step — just use `/api/v1/generate`.

## Implementation

Use Python to call the API. Always use `multipart/form-data` (not JSON).

```python
import requests

# Step 1: Generate
response = requests.post(
    "http://127.0.0.1:43211/api/v1/generate",
    data={
        "prompt": "YOUR PROMPT HERE",
        "model": "imagen-4.0-generate-001",
        "aspect_ratio": "1:1"
    }
)
with open("output.png", "wb") as f:
    f.write(response.content)

# Step 2: Remove background (for transparent assets)
with open("output.png", "rb") as f:
    response = requests.post(
        "http://127.0.0.1:43211/api/v1/process",
        files={"file": ("output.png", f, "image/png")}
    )
with open("output_transparent.png", "wb") as f:
    f.write(response.content)
```

## Prompting Guide

### Base Art Style (prepend to ALL prompts)

```
Clean minimalist risograph print illustration. Flat color blocking in 2-3 solid ink layers, bold geometric shapes. Sparse hatching only for shading — large areas of clean flat color. No grain, no noise, no halftone dots. Sharp edges, high contrast, simple iconic forms.
```

### Transparent Items (icons, items, sprites)

For assets that need background removal, craft prompts that produce **clean cutouts**:

**Template:**
```
[ART STYLE PREFIX] Single [ITEM DESCRIPTION] centered on a plain solid black background.
No other objects, no text, no borders, no shadows on the background.
Sharp edges, high contrast, bold geometric shapes, flat color blocking.
The [ITEM] should be fully contained within the frame with padding around all edges.
[ARCHETYPE COLOR PALETTE if relevant]
```

**Key principles:**
- **"Plain solid black background"** — black works better than white with neon art style; gives the background remover a uniform field to strip
- **"Single [item] centered"** — keeps the subject isolated, no clutter
- **"No shadows on the background"** — prevents soft semi-transparent edges that survive background removal
- **"Sharp edges"** — clean silhouette = clean cutout
- **"Fully contained with padding"** — ensures the subject doesn't get clipped at edges
- **Avoid** "floating", "glowing aura", or "ethereal" phrasing — creates soft transparent halos that survive background removal
- **Always use `aspect_ratio: 1:1`** for icons

**Example prompts:**

Potion icon:
> Clean minimalist risograph print illustration. Single glowing neon health potion bottle centered on a plain solid black background. Vermillion red liquid, bold geometric glass shape. No other objects, no text, no shadows on the background. Sharp edges, flat color blocking. Fully contained within the frame with padding around all edges.

Shield icon:
> Clean minimalist risograph print illustration. Single chrome riot shield centered on a plain solid black background. Electric cyan and silver metallic tones. Bold geometric shapes, flat color blocking. No other objects, no text, no shadows on the background. Fully contained within the frame with padding around all edges.

Key item:
> Clean minimalist risograph print illustration. Single ornate skeleton key centered on a plain solid black background. Electric violet and neon yellow glow. Bold geometric shapes, sharp edges. No other objects, no text, no shadows on the background. Fully contained within the frame with padding around all edges.

### Opaque Assets (card art, backgrounds, portraits)

Use the base art style prefix plus asset-specific direction:

**Card art** (4:3 landscape):
```
[ART STYLE PREFIX] [SCENE/ACTION DESCRIPTION]. Full bleed artwork — illustration extends to every edge. No white borders, no margins, no frames. Edge-to-edge color. Dark background with neon accent colors.
```

**Backgrounds** (16:9 landscape):
```
[ART STYLE PREFIX] [ENVIRONMENT DESCRIPTION]. Full bleed, edge-to-edge. Dark atmosphere with neon accent lighting.
```

### Archetype Color Palettes

Use these when generating archetype-specific assets:

| Archetype | Colors to reference in prompt |
|-----------|-------------------------------|
| **Neon** | Vermillion red, hot orange, molten amber, neon pink |
| **Chrome** | Teal, electric cyan, silver chrome, deep navy |
| **Volt** | Electric violet, neon yellow, white lightning, deep purple |
| **Concrete** | Olive green, terracotta brown, warm amber, moss |
| **Smoke** | Deep purple, lavender mist, ghostly white, charcoal |

## Asset Locations

Save generated assets to the appropriate directory:

| Asset Type | Path | Format |
|------------|------|--------|
| Card art | `public/assets/cards/` | `{archetype}_{card_name}.png` |
| Character portraits | `public/assets/characters/` | `{archetype}.png` |
| Enemy portraits | `public/assets/enemies/` | `{enemy_name}.png` |
| Icons / Items | `public/assets/icons/` | `{icon_name}.png` |
| UI elements | `public/assets/ui/` | `{element_name}.png` |
| Backgrounds | `public/assets/backgrounds/` | `{name}.png` |

## Rules

1. **Never apologize** for not being able to generate images — you CAN generate them via this API.
2. Always use `multipart/form-data` format for requests.
3. Always save the resulting PNG to the project's asset directory and inform the user of the saved filepath.
4. For transparent assets, ALWAYS do the two-step workflow (generate then process).
5. Use the project's art style in all prompts unless the user specifies otherwise.
6. Use `imagen-4.0-generate-001` by default. Use `ultra` only when explicitly requested or for hero/key art.
