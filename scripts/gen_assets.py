#!/usr/bin/env python3
"""Generate app icons and sound assets for PuzzleVerse."""

import struct, wave, math, os
from PIL import Image, ImageDraw

ASSETS = os.path.join(os.path.dirname(__file__), '..', 'assets')

# ── Colors ─────────────────────────────────────────────────────────────
BG       = (30, 26, 20)       # #1E1A14
CREAM    = (251, 246, 238)    # #FBF6EE
PEACH    = (255, 224, 204)    # #FFE0CC  word
GOLD     = (255, 237, 184)    # #FFEDB8  logic
GREEN    = (216, 236, 212)    # #D8ECD4  number
LAVENDER = (227, 216, 255)    # #E3D8FF  visual

def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill)

def make_logo_layer(size, padding_frac=0.12, gap_frac=0.04):
    """4-quadrant logo on transparent background, centered."""
    img = Image.new('RGBA', (size, size), (0,0,0,0))
    draw = ImageDraw.Draw(img)

    pad = int(size * padding_frac)
    gap = int(size * gap_frac)
    inner = size - 2*pad
    cell = (inner - gap) // 2
    r = int(cell * 0.17)

    colors = [PEACH, GOLD, GREEN, LAVENDER]
    positions = [
        (pad,        pad),
        (pad+cell+gap, pad),
        (pad,        pad+cell+gap),
        (pad+cell+gap, pad+cell+gap),
    ]
    for (x, y), c in zip(positions, colors):
        rounded_rect(draw, [x, y, x+cell, y+cell], r, c)

    return img

def make_icon(size=1024, bg_radius_frac=0.225, dark_bg=True, transparent_bg=False):
    """Full app icon with dark/cream background and rotated card."""
    img = Image.new('RGBA', (size, size), (0,0,0,0))
    draw = ImageDraw.Draw(img)

    if not transparent_bg:
        bg_color = BG if dark_bg else CREAM
        br = int(size * bg_radius_frac)
        rounded_rect(draw, [0, 0, size, size], br, bg_color + (255,))

    # Inner card (cream), slightly rotated
    card_size = int(size * 0.66)
    card_img = Image.new('RGBA', (card_size, card_size), (0,0,0,0))
    card_draw = ImageDraw.Draw(card_img)
    card_r = int(card_size * 0.12)
    rounded_rect(card_draw, [0, 0, card_size, card_size], card_r, CREAM + (255,))

    # Logo grid on top of the card
    logo = make_logo_layer(card_size, padding_frac=0.15, gap_frac=0.045)
    card_img = Image.alpha_composite(card_img, logo)

    # Rotate card and paste centered
    card_rotated = card_img.rotate(-5, resample=Image.BICUBIC, expand=True)
    cx = (size - card_rotated.width) // 2
    cy = (size - card_rotated.height) // 2
    img.alpha_composite(card_rotated, (cx, cy))

    return img

def make_splash_icon(size=512):
    """Just the logo grid on transparent background for splash screen."""
    img = Image.new('RGBA', (size, size), (0,0,0,0))
    logo = make_logo_layer(size, padding_frac=0.10, gap_frac=0.05)
    img = Image.alpha_composite(img, logo)
    return img

def make_monochrome_icon(size=1024):
    """White logo silhouette on transparent background."""
    img = Image.new('RGBA', (size, size), (0,0,0,0))
    draw = ImageDraw.Draw(img)

    card_size = int(size * 0.66)
    card_img = Image.new('RGBA', (card_size, card_size), (0,0,0,0))
    card_draw = ImageDraw.Draw(card_img)
    card_r = int(card_size * 0.12)
    rounded_rect(card_draw, [0, 0, card_size, card_size], card_r, (255,255,255,255))

    pad = int(card_size * 0.15)
    gap = int(card_size * 0.045)
    inner = card_size - 2*pad
    cell = (inner - gap) // 2
    r = int(cell * 0.17)
    positions = [
        (pad,        pad),
        (pad+cell+gap, pad),
        (pad,        pad+cell+gap),
        (pad+cell+gap, pad+cell+gap),
    ]
    for (x, y) in positions:
        rounded_rect(card_draw, [x, y, x+cell, y+cell], r, (200, 200, 200, 255))

    card_rotated = card_img.rotate(-5, resample=Image.BICUBIC, expand=True)
    cx = (size - card_rotated.width) // 2
    cy = (size - card_rotated.height) // 2
    img.alpha_composite(card_rotated, (cx, cy))
    return img

# ── Generate icons ──────────────────────────────────────────────────────
print("Generating icons...")

# iOS / Store icon (no alpha channel — App Store requires RGB)
icon = make_icon(1024, dark_bg=True)
icon_rgb = Image.new('RGB', (1024, 1024), BG)
icon_rgb.paste(icon, mask=icon.split()[3])
icon_rgb.save(os.path.join(ASSETS, 'icon.png'))
icon_rgb.save(os.path.join(ASSETS, 'store-icon.png'))
print("  icon.png ✓")

# Android adaptive foreground (transparent bg, just the card)
fg = make_icon(1024, transparent_bg=True)
fg.save(os.path.join(ASSETS, 'android-icon-foreground.png'))
print("  android-icon-foreground.png ✓")

# Android adaptive background (solid cream)
bg_img = Image.new('RGBA', (1024, 1024), CREAM + (255,))
bg_img.save(os.path.join(ASSETS, 'android-icon-background.png'))
print("  android-icon-background.png ✓")

# Android monochrome
mono = make_monochrome_icon(1024)
mono.save(os.path.join(ASSETS, 'android-icon-monochrome.png'))
print("  android-icon-monochrome.png ✓")

# Splash icon
splash = make_splash_icon(512)
splash.save(os.path.join(ASSETS, 'splash-icon.png'))
print("  splash-icon.png ✓")

# Favicon
fav = make_icon(64, dark_bg=True)
fav_rgb = Image.new('RGB', (64, 64), BG)
fav_rgb.paste(fav, mask=fav.split()[3])
fav_rgb.save(os.path.join(ASSETS, 'favicon.png'))
print("  favicon.png ✓")

# ── Generate sounds ─────────────────────────────────────────────────────
SOUNDS = os.path.join(ASSETS, 'sounds')
SAMPLE_RATE = 22050

def make_wav(path, frames):
    with wave.open(path, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        f.writeframes(b''.join(struct.pack('<h', max(-32768, min(32767, int(s)))) for s in frames))

def sine(freq, duration, amp=0.35, fade_ms=20):
    n = int(SAMPLE_RATE * duration)
    fade = int(SAMPLE_RATE * fade_ms / 1000)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        s = amp * 32767 * math.sin(2 * math.pi * freq * t)
        # fade in/out
        if i < fade:
            s *= i / fade
        elif i > n - fade:
            s *= (n - i) / fade
        samples.append(s)
    return samples

def chord(freqs, duration, amp=0.22, fade_ms=30):
    n = int(SAMPLE_RATE * duration)
    fade = int(SAMPLE_RATE * fade_ms / 1000)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        s = sum(amp * 32767 * math.sin(2 * math.pi * f * t) for f in freqs)
        if i < fade:
            s *= i / fade
        elif i > n - fade:
            s *= (n - i) / fade
        samples.append(s)
    return samples

def glide(f0, f1, duration, amp=0.3, fade_ms=20):
    n = int(SAMPLE_RATE * duration)
    fade = int(SAMPLE_RATE * fade_ms / 1000)
    phase = 0.0
    samples = []
    for i in range(n):
        t = i / n
        freq = f0 + (f1 - f0) * t
        phase += 2 * math.pi * freq / SAMPLE_RATE
        s = amp * 32767 * math.sin(phase)
        if i < fade:
            s *= i / fade
        elif i > n - fade:
            s *= (n - i) / fade
        samples.append(s)
    return samples

print("\nGenerating sounds...")

# key.wav — soft low click
make_wav(os.path.join(SOUNDS, 'key.wav'), sine(180, 0.06, amp=0.18))
print("  key.wav ✓")

# correct.wav — bright ascending ding
frames = glide(440, 660, 0.12, amp=0.32) + glide(660, 880, 0.10, amp=0.25)
make_wav(os.path.join(SOUNDS, 'correct.wav'), frames)
print("  correct.wav ✓")

# present.wav — mid tone blip
make_wav(os.path.join(SOUNDS, 'present.wav'), sine(392, 0.10, amp=0.28))
print("  present.wav ✓")

# absent.wav — low dull thud
make_wav(os.path.join(SOUNDS, 'absent.wav'), sine(220, 0.10, amp=0.22))
print("  absent.wav ✓")

# win.wav — pleasant major chord swell
win_frames = chord([261, 329, 392, 523], 0.45, amp=0.18)
make_wav(os.path.join(SOUNDS, 'win.wav'), win_frames)
print("  win.wav ✓")

# lose.wav — descending glide
make_wav(os.path.join(SOUNDS, 'lose.wav'), glide(440, 220, 0.35, amp=0.28))
print("  lose.wav ✓")

print("\nAll assets generated.")
