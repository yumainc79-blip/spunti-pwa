"""
Generate PWA icons for Spunti using only Python stdlib.

The installed icon should match the app's internal symbol concept: a small green sprout/fogliolina.
This avoids fragile emoji-font rendering in GitHub Actions.

Run from project root:
    python tools/generate_icons.py
"""

import math
import os
import struct
import zlib


# ── Palette ────────────────────────────────────────────────────────────────
BG = (107, 124, 110)       # #6b7c6e  salvia app
SURFACE = (245, 240, 235)  # #f5f0eb  fondo caldo app
LEAF = (126, 177, 54)      # green sprout leaf
LEAF_DARK = (82, 137, 43)  # darker green for depth
STEM = (92, 142, 48)


# ── PNG writer ─────────────────────────────────────────────────────────────
def _chunk(tag: bytes, data: bytes) -> bytes:
    payload = tag + data
    return struct.pack('>I', len(data)) + payload + struct.pack('>I', zlib.crc32(payload) & 0xFFFFFFFF)


def write_png(path: str, pixels: list, size: int) -> None:
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    raw = b''
    for row in range(size):
        raw += b'\x00'
        for col in range(size):
            raw += bytes(pixels[row * size + col])
    png = b'\x89PNG\r\n\x1a\n' + _chunk(b'IHDR', ihdr) + _chunk(b'IDAT', zlib.compress(raw, 9)) + _chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)


def mix(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


# ── Geometry helpers. Normalised coords: x,y in -1..+1, y down. ───────────
def in_rot_ellipse(x, y, cx, cy, rx, ry, deg):
    dx, dy = x - cx, y - cy
    r = math.radians(deg)
    lx = dx * math.cos(r) + dy * math.sin(r)
    ly = -dx * math.sin(r) + dy * math.cos(r)
    return (lx / rx) ** 2 + (ly / ry) ** 2 <= 1.0


def dist_to_segment(px, py, x1, y1, x2, y2):
    vx, vy = x2 - x1, y2 - y1
    wx, wy = px - x1, py - y1
    c1 = vx * wx + vy * wy
    if c1 <= 0:
        return math.hypot(px - x1, py - y1)
    c2 = vx * vx + vy * vy
    if c2 <= c1:
        return math.hypot(px - x2, py - y2)
    b = c1 / c2
    bx, by = x1 + b * vx, y1 + b * vy
    return math.hypot(px - bx, py - by)


def in_round_rect(x, y, half_w, half_h, radius):
    qx = abs(x) - (half_w - radius)
    qy = abs(y) - (half_h - radius)
    ox = max(qx, 0)
    oy = max(qy, 0)
    outside = math.hypot(ox, oy)
    inside = min(max(qx, qy), 0)
    return outside + inside <= radius


def layer_color(x, y, maskable=False):
    """Return RGB for one supersampled point."""
    color = BG

    # Pale rounded tile behind the sprout, launcher-safe.
    tile_w = 0.72 if maskable else 0.78
    tile_h = 0.72 if maskable else 0.78
    if in_round_rect(x, y, tile_w, tile_h, 0.22):
        color = mix(BG, SURFACE, 0.82)

    # Soft central halo, like the light bubble behind active app icons.
    r2 = x * x + y * y
    if r2 <= 0.58 ** 2:
        halo = max(0, 1 - r2 / (0.58 ** 2)) * 0.20
        color = mix(color, SURFACE, halo)

    scale = 0.86 if not maskable else 0.72
    sx, sy = x / scale, y / scale

    # Emoji-like sprout: two broad leaves plus curved stem.
    left_leaf = in_rot_ellipse(sx, sy, -0.23, -0.12, 0.33, 0.16, 23)
    right_leaf = in_rot_ellipse(sx, sy, 0.23, -0.15, 0.36, 0.17, -34)
    stem_main = dist_to_segment(sx, sy, -0.02, 0.55, 0.02, -0.02) <= 0.045
    stem_curve = dist_to_segment(sx, sy, 0.02, 0.15, 0.22, -0.03) <= 0.035

    if stem_main or stem_curve:
        color = STEM
    if left_leaf:
        color = LEAF
    if right_leaf:
        color = mix(LEAF, LEAF_DARK, 0.12)

    # Small leaf highlights to make it closer to the native 🌱 emoji.
    if in_rot_ellipse(sx, sy, -0.28, -0.15, 0.20, 0.055, 23):
        color = mix(color, SURFACE, 0.20)
    if in_rot_ellipse(sx, sy, 0.29, -0.20, 0.22, 0.055, -34):
        color = mix(color, SURFACE, 0.18)

    return color


# ── Renderer ───────────────────────────────────────────────────────────────
SS = 4


def make_pixels(size: int, maskable: bool = False) -> list:
    inv = 1.0 / size
    pixels = []
    for row in range(size):
        for col in range(size):
            acc = [0, 0, 0]
            for si in range(SS):
                for sj in range(SS):
                    px = (col + (sj + 0.5) / SS) * inv
                    py = (row + (si + 0.5) / SS) * inv
                    x = (px - 0.5) * 2
                    y = (py - 0.5) * 2
                    c = layer_color(x, y, maskable)
                    acc[0] += c[0]
                    acc[1] += c[1]
                    acc[2] += c[2]
            n = SS * SS
            pixels.append((round(acc[0] / n), round(acc[1] / n), round(acc[2] / n)))
    return pixels


ICONS = [
    ('icons/icon-192.png', 192, False),
    ('icons/icon-512.png', 512, False),
    ('icons/maskable-192.png', 192, True),
    ('icons/maskable-512.png', 512, True),
    ('icons/apple-touch-icon.png', 180, False),
]


def write_favicon_svg():
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#6b7c6e"/>
  <rect x="8" y="8" width="48" height="48" rx="15" fill="#f5f0eb" opacity="0.82"/>
  <path d="M31 50 C31 39 31 31 32 23" stroke="#5c8e30" stroke-width="4" stroke-linecap="round" fill="none"/>
  <ellipse cx="24" cy="25" rx="12" ry="6" transform="rotate(23 24 25)" fill="#7eb136"/>
  <ellipse cx="40" cy="23" rx="13" ry="6.5" transform="rotate(-34 40 23)" fill="#75a933"/>
</svg>
'''
    with open('icons/favicon.svg', 'w', encoding='utf-8') as f:
        f.write(svg)


def main():
    os.makedirs('icons', exist_ok=True)
    for path, size, maskable in ICONS:
        label = f'{path} ({size}x{size}{" maskable" if maskable else ""})'
        print(f'Generating {label}…', end=' ', flush=True)
        write_png(path, make_pixels(size, maskable), size)
        print(f'{os.path.getsize(path) / 1024:.1f} KB')
    write_favicon_svg()
    print('Generating icons/favicon.svg… done')


if __name__ == '__main__':
    main()
