#!/usr/bin/env python3
"""
PuzzleVerse — App asset generator
Generates all icons and splash images from code.

Design:
  App icon  : #6C63FF (electric indigo) rounded square + white puzzle piece
  Splash    : white puzzle piece on transparent bg (sits on #0D0D1A from app.json)
  Android   : white piece on transparent foreground / #6C63FF solid background
  Favicon   : mini app icon (196×196)

Run from project root:
  python3 scripts/generate-assets.py
"""

from PIL import Image, ImageDraw, ImageFilter
import os, math

ASSETS = os.path.join(os.path.dirname(__file__), '..', 'assets')

# ── Brand colours ──────────────────────────────────────────────────────────────
INDIGO      = (108,  99, 255)   # #6C63FF
INDIGO_DARK = ( 78,  70, 220)   # #4E46DC  — darker shade for gradient bottom
DARK_BG     = ( 13,  13,  26)   # #0D0D1A
WHITE       = (255, 255, 255)


# ── Core helpers ───────────────────────────────────────────────────────────────

def puzzle_mask(W: int, H: int, body: int, tab_ratio: float = 0.215) -> Image.Image:
    """
    Returns an L-mode mask of a single puzzle piece centred in (W × H).

    Anatomy:
      - Top  edge: tab protrudes OUT  (upward)
      - Right edge: tab protrudes OUT  (rightward)
      - Bottom edge: notch cut IN
      - Left  edge: notch cut IN

    Drawing order matters:
      1. Fill body rectangle (255)
      2. Add top & right tab circles  (255)
      3. Cut bottom & left notch circles (0) — overwrite painted pixels
    """
    cx, cy  = W // 2, H // 2
    half    = body // 2
    tab_r   = int(body * tab_ratio)

    x1, y1 = cx - half, cy - half
    x2, y2 = cx + half, cy + half

    m = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(m)

    d.rectangle([x1, y1, x2, y2], fill=255)                        # body
    d.ellipse([cx-tab_r, y1-tab_r, cx+tab_r, y1+tab_r], fill=255)  # top tab OUT
    d.ellipse([x2-tab_r, cy-tab_r, x2+tab_r, cy+tab_r], fill=255)  # right tab OUT
    d.ellipse([cx-tab_r, y2-tab_r, cx+tab_r, y2+tab_r], fill=0)    # bottom notch IN
    d.ellipse([x1-tab_r, cy-tab_r, x1+tab_r, cy+tab_r], fill=0)    # left notch IN

    return m


def piece_layer(W: int, H: int, body: int, color: tuple,
                tab_ratio: float = 0.215) -> Image.Image:
    """RGBA layer: puzzle piece in `color` on transparent background."""
    mask = puzzle_mask(W, H, body, tab_ratio)
    layer = Image.new('RGBA', (W, H), (*color, 255))
    layer.putalpha(mask)
    return layer


def rounded_bg(size: int, top_color: tuple, bottom_color: tuple,
               radius: int) -> Image.Image:
    """RGBA rounded-square with a gentle vertical gradient."""
    base = Image.new('RGBA', (size, size), (0, 0, 0, 0))

    # Build gradient on a full rectangle first
    grad = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    for y in range(size):
        t = y / (size - 1)
        r = round(top_color[0] + (bottom_color[0] - top_color[0]) * t)
        g = round(top_color[1] + (bottom_color[1] - top_color[1]) * t)
        b = round(top_color[2] + (bottom_color[2] - top_color[2]) * t)
        ImageDraw.Draw(grad).line([(0, y), (size - 1, y)], fill=(r, g, b, 255))

    # Rounded-rect mask
    shape_mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(shape_mask).rounded_rectangle(
        [0, 0, size - 1, size - 1], radius=radius, fill=255
    )
    grad.putalpha(shape_mask)
    return Image.alpha_composite(base, grad)


def shadow_layer(W: int, H: int, body: int, offset: int = 0,
                 blur: int = 0) -> Image.Image:
    """
    Soft drop shadow for the puzzle piece.
    offset = px offset (applied +x, +y)
    blur   = gaussian blur radius
    """
    mask = puzzle_mask(W, H, body)

    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    dark = Image.new('RGBA', (W, H), (0, 0, 20, 130))   # semi-transparent dark indigo
    dark.putalpha(mask)

    # Offset
    shifted = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    shifted.paste(dark, (offset, offset))

    if blur:
        shifted = shifted.filter(ImageFilter.GaussianBlur(radius=blur))
    return shifted


# ── Asset generators ───────────────────────────────────────────────────────────

def gen_app_icon(path: str, size: int = 1024) -> None:
    """
    icon.png — full-bleed indigo gradient square + white puzzle piece + shadow.
    No pre-baked rounded corners: iOS/Android apply their own rounding masks,
    so the PNG must be a solid square (no transparent corners) or corners become black.
    """
    # Full-bleed gradient background (no transparency — fills every pixel)
    bg = Image.new('RGB', (size, size), INDIGO)
    for y in range(size):
        t = y / (size - 1)
        r = round(INDIGO[0] + (INDIGO_DARK[0] - INDIGO[0]) * t)
        g = round(INDIGO[1] + (INDIGO_DARK[1] - INDIGO[1]) * t)
        b = round(INDIGO[2] + (INDIGO_DARK[2] - INDIGO[2]) * t)
        ImageDraw.Draw(bg).line([(0, y), (size - 1, y)], fill=(r, g, b))
    bg = bg.convert('RGBA')

    body = round(size * 0.56)
    shad  = shadow_layer(size, size, body, offset=round(size * 0.025),
                         blur=round(size * 0.028))
    piece = piece_layer(size, size, body, WHITE)

    result = Image.alpha_composite(bg, shad)
    result = Image.alpha_composite(result, piece)
    result.convert('RGB').save(path)


def gen_splash_icon(path: str, size: int = 512) -> None:
    """
    splash-icon.png — transparent background, white puzzle piece.
    Expo centres this on the #0D0D1A splash background defined in app.json.
    """
    body  = round(size * 0.78)
    piece = piece_layer(size, size, body, WHITE)
    piece.save(path)


def gen_adaptive_foreground(path: str, size: int = 1024) -> None:
    """
    android-icon-foreground.png — transparent bg, white piece in safe zone.
    Android clips adaptive icons to various shapes; content inside the
    centre ~66 % (≈ 676 px at 1024) is always visible.
    body=500 keeps the widest dimension (body + tab) ≈ 630 px < 676 px.
    """
    body  = round(size * 0.49)   # 501 px; widest span ≈ 501 + 2*110 ≈ 630 px
    piece = piece_layer(size, size, body, WHITE)

    bg = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    result = Image.alpha_composite(bg, piece)
    result.save(path)


def gen_adaptive_background(path: str, size: int = 1024) -> None:
    """android-icon-background.png — solid #6C63FF fill."""
    Image.new('RGB', (size, size), INDIGO).save(path)


def gen_monochrome(path: str, size: int = 1024) -> None:
    """
    android-icon-monochrome.png — white puzzle piece on black.
    Used by Android 13+ for themed/tinted icons.
    """
    body  = round(size * 0.49)
    piece = piece_layer(size, size, body, WHITE)

    bg = Image.new('RGBA', (size, size), (0, 0, 0, 255))
    result = Image.alpha_composite(bg, piece)
    result.convert('RGB').save(path)


def gen_favicon(path: str, size: int = 196) -> None:
    """favicon.png — mini version of the app icon for web (rounded square)."""
    # For web favicon, pre-bake the rounded corners so it looks right in browser tabs
    bg   = rounded_bg(size, INDIGO, INDIGO_DARK, radius=round(size * 0.22))
    body = round(size * 0.56)
    piece = piece_layer(size, size, body, WHITE)
    result = Image.alpha_composite(bg, piece)
    result.save(path)   # keep RGBA so rounded corners are transparent in browser


# ── Main ───────────────────────────────────────────────────────────────────────

ASSETS = os.path.normpath(ASSETS)

def p(name: str) -> str:
    return os.path.join(ASSETS, name)

if __name__ == '__main__':
    print(f'Writing to: {ASSETS}\n')

    gen_app_icon(p('icon.png'), 1024)
    print('  ✓  icon.png                     1024×1024')

    gen_splash_icon(p('splash-icon.png'), 512)
    print('  ✓  splash-icon.png               512×512  (transparent bg)')

    gen_adaptive_foreground(p('android-icon-foreground.png'), 1024)
    print('  ✓  android-icon-foreground.png  1024×1024  (white piece, transparent bg)')

    gen_adaptive_background(p('android-icon-background.png'), 1024)
    print('  ✓  android-icon-background.png  1024×1024  (solid #6C63FF)')

    gen_monochrome(p('android-icon-monochrome.png'), 1024)
    print('  ✓  android-icon-monochrome.png  1024×1024  (white on black)')

    gen_favicon(p('favicon.png'), 196)
    print('  ✓  favicon.png                   196×196')

    print('\nDone. Run `npx expo start --clear` to pick up new assets.')
