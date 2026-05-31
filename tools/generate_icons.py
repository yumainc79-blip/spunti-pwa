"""
Generate PWA icons for Spunti using the same sprout symbol used inside the app: 🌱.

Run from project root:
    python tools/generate_icons.py

Requires Pillow:
    python -m pip install Pillow

On Windows it uses Segoe UI Emoji when available.
"""

from pathlib import Path
import os

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError as exc:
    raise SystemExit(
        "Pillow is required. Install it with:\n\n"
        "    python -m pip install Pillow\n"
    ) from exc

BG = "#6b7c6e"
SURFACE = "#f5f0eb"
SPROUT = "🌱"

ICONS = [
    ("icons/icon-192.png", 192, False),
    ("icons/icon-512.png", 512, False),
    ("icons/maskable-192.png", 192, True),
    ("icons/maskable-512.png", 512, True),
    ("icons/apple-touch-icon.png", 180, False),
]


def font_candidates():
    return [
        Path(r"C:\Windows\Fonts\seguiemj.ttf"),
        Path(r"C:\Windows\Fonts\seguisym.ttf"),
        Path("/System/Library/Fonts/Apple Color Emoji.ttc"),
        Path("/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"),
        Path("/usr/share/fonts/truetype/noto/NotoEmoji-Regular.ttf"),
        Path("/usr/share/fonts/opentype/noto/NotoColorEmoji.ttf"),
    ]


def load_font(size):
    for path in font_candidates():
        if not path.exists():
            continue
        try:
            return ImageFont.truetype(str(path), size=size)
        except Exception:
            continue
    raise SystemExit("No emoji-capable font found. On Windows, check C:\\Windows\\Fonts\\seguiemj.ttf")


def render_icon(path, size, maskable=False):
    ss = 4
    canvas = size * ss
    img = Image.new("RGBA", (canvas, canvas), BG)
    draw = ImageDraw.Draw(img)

    # Pale halo behind the same 🌱 symbol used in the app.
    pad = int(canvas * (0.16 if maskable else 0.12))
    draw.rounded_rectangle(
        (pad, pad, canvas - pad, canvas - pad),
        radius=int(canvas * 0.22),
        fill=(245, 240, 235, 54),
    )

    font_size = int(canvas * (0.58 if maskable else 0.66))
    font = load_font(font_size)
    bbox = draw.textbbox((0, 0), SPROUT, font=font, embedded_color=True)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (canvas - tw) / 2 - bbox[0]
    y = (canvas - th) / 2 - bbox[1] - canvas * 0.015
    draw.text((x, y), SPROUT, font=font, embedded_color=True)

    img = img.resize((size, size), Image.Resampling.LANCZOS)
    img.save(path, "PNG")


def write_favicon_svg():
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="{BG}"/>
  <circle cx="32" cy="32" r="22" fill="{SURFACE}" opacity="0.18"/>
  <text x="32" y="43" text-anchor="middle" font-size="34" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">{SPROUT}</text>
</svg>
'''
    Path("icons/favicon.svg").write_text(svg, encoding="utf-8")


def main():
    os.makedirs("icons", exist_ok=True)
    print("Generating icons with app sprout symbol: 🌱")
    for path, size, maskable in ICONS:
        print(f"Generating {path} ({size}x{size}{' maskable' if maskable else ''})…", end=" ")
        render_icon(path, size, maskable)
        print("done")
    write_favicon_svg()
    print("Generating icons/favicon.svg… done")


if __name__ == "__main__":
    main()
