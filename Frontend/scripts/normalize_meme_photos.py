#!/usr/bin/env python3
"""Normalize fighter portraits to a shared square resolution."""

from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1] / "src" / "assets" / "memes"
SIZE = 768
EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def to_rgb(im: Image.Image) -> Image.Image:
    if im.mode in ("RGBA", "LA"):
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        return bg
    if im.mode == "P":
        return im.convert("RGBA").convert("RGB")
    if im.mode != "RGB":
        return im.convert("RGB")
    return im


def normalize(im: Image.Image) -> Image.Image:
    im = to_rgb(im)
    bg = ImageOps.fit(im, (SIZE, SIZE), method=Image.Resampling.LANCZOS)
    bg = bg.filter(ImageFilter.GaussianBlur(28))
    bg = ImageEnhance.Brightness(bg).enhance(0.72)
    bg = ImageEnhance.Color(bg).enhance(0.85)

    src_w, src_h = im.size
    scale = min(SIZE / src_w, SIZE / src_h)
    new_w = max(1, int(src_w * scale))
    new_h = max(1, int(src_h * scale))
    fg = im.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = bg
    canvas.paste(fg, ((SIZE - new_w) // 2, (SIZE - new_h) // 2))
    return canvas


def main() -> None:
    files = [p for p in sorted(ROOT.iterdir()) if p.suffix.lower() in EXTS]
    for path in files:
        im = Image.open(path)
        out = normalize(im)
        dest = ROOT / f"{path.stem}.jpg"
        out.save(dest, format="JPEG", quality=90, optimize=True)
        if dest.resolve() != path.resolve():
            path.unlink()
        print(f"{dest.name:40} {out.size[0]}x{out.size[1]}")


if __name__ == "__main__":
    main()
