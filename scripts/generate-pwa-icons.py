"""Gera ícones PWA para Histórico de Louvores."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1] / "public" / "icons"
BG = (15, 23, 32)  # #0f1720
PANEL = (23, 34, 49)  # #172231
ACCENT = (61, 155, 253)  # #3d9bfd
TEXT = (232, 238, 246)  # #e8eef6


def _rounded_rect(draw: ImageDraw.ImageDraw, box: tuple, radius: int, fill) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def _draw_music_note(draw: ImageDraw.ImageDraw, cx: float, cy: float, scale: float) -> None:
    head_w = 52 * scale
    head_h = 38 * scale
    hx = cx - head_w * 0.35
    hy = cy + 8 * scale
    draw.ellipse((hx, hy, hx + head_w, hy + head_h), fill=ACCENT)
    stem_x = hx + head_w * 0.72
    stem_top = cy - 95 * scale
    stem_bot = hy + head_h * 0.35
    draw.rounded_rectangle(
        (stem_x, stem_top, stem_x + 10 * scale, stem_bot),
        radius=int(4 * scale),
        fill=ACCENT,
    )
    # flag
    flag = [
        (stem_x + 8 * scale, stem_top),
        (stem_x + 58 * scale, stem_top + 22 * scale),
        (stem_x + 58 * scale, stem_top + 48 * scale),
        (stem_x + 8 * scale, stem_top + 32 * scale),
    ]
    draw.polygon(flag, fill=ACCENT)


def _font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for name in ("segoeui.ttf", "arial.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def render_icon(size: int, maskable: bool) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(img)

    if maskable:
        margin = int(size * 0.18)
    else:
        margin = int(size * 0.1)

    inner = size - margin * 2
    pad = int(inner * 0.08)
    box = (margin, margin, size - margin, size - margin)
    _rounded_rect(draw, box, radius=int(inner * 0.16), fill=PANEL)

    cx = size / 2
    cy = size / 2
    scale = inner / 512
    _draw_music_note(draw, cx - 18 * scale, cy - 22 * scale, scale)

    font = _font(int(72 * scale))
    label = "HL"
    bbox = draw.textbbox((0, 0), label, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw / 2 + 28 * scale
    ty = cy + 12 * scale
    draw.text((tx, ty), label, font=font, fill=TEXT)

    # subtle accent ring
    ring = int(inner * 0.42)
    draw.ellipse(
        (cx - ring, cy - ring - 8 * scale, cx + ring, cy + ring - 8 * scale),
        outline=(61, 155, 253, 60),
        width=max(2, int(3 * scale)),
    )
    return img


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    outputs = [
        (192, False, "icon-192.png"),
        (512, False, "icon-512.png"),
        (192, True, "icon-192-maskable.png"),
        (512, True, "icon-512-maskable.png"),
        (180, False, "apple-touch-icon.png"),
    ]
    for size, maskable, name in outputs:
        img = render_icon(size, maskable)
        path = ROOT / name
        img.convert("RGB").save(path, "PNG", optimize=True)
        print(f"wrote {path} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()