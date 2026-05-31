"""
Generate PWA icons for Spunti using only Python stdlib (struct + zlib).
Run from the project root: python tools/generate_icons.py

Design: two sage-coloured elliptical leaves tilted outward + thin stem,
on a solid salvia green background. 4x supersampling for smooth edges.
"""

import math
import os
import struct
import zlib


# ── Palette ────────────────────────────────────────────────────────────────
BG  = (107, 124, 110)   # #6b7c6e  salvia
SYM = (234, 240, 235)   # #eaf0eb  salvia chiaro


# ── PNG writer ─────────────────────────────────────────────────────────────
def _chunk(tag: bytes, data: bytes) -> bytes:
    payload = tag + data
    return struct.pack('>I', len(data)) + payload + struct.pack('>I', zlib.crc32(payload) & 0xFFFFFFFF)


def write_png(path: str, pixels: list, size: int) -> None:
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    raw = b''
    for row in range(size):
        raw += b'\x00'                          # filter: None
        for col in range(size):
            raw += bytes(pixels[row * size + col])
    png = (
        b'\x89PNG\r\n\x1a\n'
        + _chunk(b'IHDR', ihdr)
        + _chunk(b'IDAT', zlib.compress(raw, 9))
        + _chunk(b'IEND', b'')
    )
    with open(path, 'wb') as f:
        f.write(png)


# ── Icon geometry (normalised coords −1..+1, y↓) ──────────────────────────
def _in_ellipse(nx, ny, cx, cy, rx, ry, deg):
    dx, dy = nx - cx, ny - cy
    rad = math.radians(deg)
    lx =  dx * math.cos(rad) + dy * math.sin(rad)
    ly = -dx * math.sin(rad) + dy * math.cos(rad)
    return (lx / rx) ** 2 + (ly / ry) ** 2 <= 1.0


def _in_symbol(nx, ny, s):
    """True if the point is inside the sprout symbol (scale factor s)."""
    right = _in_ellipse(nx, ny,  0.12, -0.12, 0.20 * s, 0.34 * s,  22)
    left  = _in_ellipse(nx, ny, -0.12, -0.12, 0.20 * s, 0.34 * s, -22)
    stem  = abs(nx) <= 0.038 * s and 0.05 * s <= ny <= 0.52 * s
    return right or left or stem


# ── Pixel renderer ─────────────────────────────────────────────────────────
SS = 4   # supersampling grid (SS×SS per pixel)


def make_pixels(size: int, maskable: bool = False) -> list:
    scale = 0.80 if maskable else 0.90
    inv = 1.0 / size
    pixels = []
    for row in range(size):
        for col in range(size):
            hits = 0
            for si in range(SS):
                for sj in range(SS):
                    px = (col + (sj + 0.5) / SS) * inv
                    py = (row + (si + 0.5) / SS) * inv
                    nx = (px - 0.5) * 2
                    ny = (py - 0.5) * 2
                    if _in_symbol(nx, ny, scale):
                        hits += 1
            t = hits / (SS * SS)
            r = round(BG[0] + (SYM[0] - BG[0]) * t)
            g = round(BG[1] + (SYM[1] - BG[1]) * t)
            b = round(BG[2] + (SYM[2] - BG[2]) * t)
            pixels.append((r, g, b))
    return pixels


# ── Main ───────────────────────────────────────────────────────────────────
ICONS = [
    ('icons/icon-192.png',         192, False),
    ('icons/icon-512.png',         512, False),
    ('icons/maskable-192.png',     192, True),
    ('icons/maskable-512.png',     512, True),
    ('icons/apple-touch-icon.png', 180, False),
]


def main():
    os.makedirs('icons', exist_ok=True)
    for path, size, maskable in ICONS:
        label = f'{path} ({size}x{size}{"  maskable" if maskable else ""})'
        print(f'Generating {label}…', end=' ', flush=True)
        px = make_pixels(size, maskable)
        write_png(path, px, size)
        kb = os.path.getsize(path) / 1024
        print(f'{kb:.1f} KB')


if __name__ == '__main__':
    main()
