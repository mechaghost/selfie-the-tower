#!/usr/bin/env python3
"""Generate 20 80s memorabilia transparent icons via local AI Image Studio."""

import requests
import os
from PIL import Image
from io import BytesIO

API = "http://127.0.0.1:43211"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

STYLE = (
    "Clean minimalist risograph print illustration. "
    "Flat color blocking in 2-3 solid ink layers, bold geometric shapes. "
    "Sparse hatching only for shading — large areas of clean flat color. "
    "No grain, no noise, no halftone dots. Sharp edges, high contrast, simple iconic forms."
)

SUFFIX = (
    "centered on a plain solid black background. "
    "No other objects, no text, no borders, no shadows on the background. "
    "Sharp edges, high contrast, bold geometric shapes, flat color blocking. "
    "Fully contained within the frame with padding around all edges."
)

ICONS = [
    ("boombox", "Single retro 80s boombox ghettoblaster with neon pink and electric cyan accents"),
    ("cassette", "Single compact cassette tape with hot orange and neon pink label"),
    ("vhs", "Single VHS videotape with electric cyan and deep navy accents"),
    ("rubiks_cube", "Single Rubik's cube with neon colored faces — pink, cyan, yellow, green"),
    ("joystick", "Single retro arcade joystick with neon red ball top and chrome base"),
    ("controller", "Single retro NES-style game controller with vermillion red buttons"),
    ("rollerskate", "Single retro roller skate with neon pink wheels and electric cyan body"),
    ("sunglasses", "Single pair of 80s aviator sunglasses with neon gradient lenses — pink to cyan"),
    ("walkman", "Single portable cassette Walkman player with hot orange and electric cyan accents"),
    ("floppy_disk", "Single 3.5 inch floppy disk with neon purple label and cyan slider"),
    ("crt_tv", "Single retro CRT television set with neon static on screen, deep purple body"),
    ("synth_keyboard", "Single 80s synthesizer keyboard with neon pink and violet keys"),
    ("pacman_ghost", "Single Pac-Man ghost character with neon cyan color and pixel eyes"),
    ("skateboard", "Single 80s skateboard deck with neon graphic — hot orange and electric violet"),
    ("polaroid", "Single Polaroid instant camera with neon pink and chrome silver body"),
    ("disco_ball", "Single mirror disco ball with neon reflections — pink, cyan, violet highlights"),
    ("microphone", "Single retro chrome microphone with neon pink and cyan glow accents"),
    ("electric_guitar", "Single electric guitar with lightning bolt design, neon yellow and violet"),
    ("laser_gun", "Single retro sci-fi ray gun blaster with neon green and chrome accents"),
    ("star", "Single bold five-pointed star with chrome metallic finish and neon pink outline"),
]

def generate_icon(name, description):
    out_path = os.path.join(OUT_DIR, f"{name}.png")
    if os.path.exists(out_path):
        print(f"  SKIP {name} (already exists)")
        return True

    prompt = f"{STYLE} Single {description} {SUFFIX}"

    # Step 1: Generate
    print(f"  Generating {name}...")
    try:
        resp = requests.post(
            f"{API}/api/v1/generate",
            data={"prompt": prompt, "model": "imagen-4.0-generate-001", "aspect_ratio": "1:1"},
            timeout=120
        )
        if resp.status_code != 200:
            print(f"  FAIL generate {name}: HTTP {resp.status_code}")
            return False
    except Exception as e:
        print(f"  FAIL generate {name}: {e}")
        return False

    raw_path = os.path.join(OUT_DIR, f"_{name}_raw.png")
    with open(raw_path, "wb") as f:
        f.write(resp.content)

    # Step 2: Remove background
    print(f"  Removing background...")
    try:
        with open(raw_path, "rb") as f:
            resp2 = requests.post(
                f"{API}/api/v1/process",
                files={"file": (f"{name}.png", f, "image/png")},
                timeout=60
            )
        if resp2.status_code != 200:
            print(f"  FAIL process {name}: HTTP {resp2.status_code}")
            os.remove(raw_path)
            return False
    except Exception as e:
        print(f"  FAIL process {name}: {e}")
        os.remove(raw_path)
        return False

    # Step 3: Resize to 256x256 max
    img = Image.open(BytesIO(resp2.content))
    img.thumbnail((256, 256), Image.LANCZOS)
    img.save(out_path, "PNG")

    # Clean up raw
    os.remove(raw_path)
    print(f"  OK {name} -> {img.size[0]}x{img.size[1]}")
    return True

if __name__ == "__main__":
    print(f"Generating {len(ICONS)} 80s memorabilia icons...\n")
    success = 0
    for name, desc in ICONS:
        if generate_icon(name, desc):
            success += 1
    print(f"\nDone: {success}/{len(ICONS)} icons generated in {OUT_DIR}")
