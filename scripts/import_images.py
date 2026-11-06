"""Imports the photos exported from Canva (or anywhere) into the public site.

Put a file named after a slot of design/images/slots.json (e.g. espace-chapelle.jpg) in
design/images/, then run `make images`: it is resized for the web, converted to the format
the site expects and written in place of the current photo. Processed files move to
design/images/done/ so the folder only shows what is still to import.
"""

import json
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
FOLDER = ROOT / "design" / "images"
SLOTS = json.loads((FOLDER / "slots.json").read_text(encoding="utf-8"))
EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")


def convert(source: Path, slot: dict) -> Path:
    target = ROOT / slot["target"]
    image = ImageOps.exif_transpose(Image.open(source))
    if image.width > slot["width"]:
        image = image.resize((slot["width"], round(image.height * slot["width"] / image.width)), Image.LANCZOS)
    suffix = target.suffix.lower()
    if suffix == ".png":
        image.save(target, optimize=True)
    elif suffix == ".webp":
        image.save(target, quality=82, method=6)
    else:
        image.convert("RGB").save(target, quality=82, optimize=True, progressive=True)
    return target


def main() -> int:
    done = FOLDER / "done"
    imported, unknown = [], []
    for source in sorted(FOLDER.iterdir()):
        if source.suffix.lower() not in EXTENSIONS:
            continue
        slot = SLOTS.get(source.stem)
        if not slot or source.stem.startswith("_"):
            unknown.append(source.name)
            continue
        target = convert(source, slot)
        done.mkdir(exist_ok=True)
        shutil.move(source, done / source.name)
        size = target.stat().st_size // 1024
        imported.append(f"{source.name} → {slot['target']} ({size} Ko)")
    for line in imported:
        print("✓", line)
    for name in unknown:
        print("? Nome non riconosciuto, ignorato:", name, "— vedi design/images/slots.json")
    if not imported and not unknown:
        print("Nessuna foto in design/images/.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
