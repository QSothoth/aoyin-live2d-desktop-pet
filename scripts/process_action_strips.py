#!/usr/bin/env python3
"""Normalize generated horizontal action strips into 192x208 transparent cells."""

from pathlib import Path
import json
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ACTIONS = ROOT / "resources" / "pets" / "aoyin" / "actions"
SOURCES = ROOT / "artifacts" / "aoyin-pet-run" / "generated-action-sources"
QA = ROOT / "artifacts" / "aoyin-pet-run" / "qa" / "action-contact-sheet.png"
CELL = (192, 208)
JOBS = {
    "glasses-wipe": 6,
    "edge-peek": 6,
    "tail-groom": 6,
    "wolf-transform": 8,
    "wolf-idle": 8,
}


def subject_bounds(source: Image.Image, expected: int) -> list[tuple[int, int]]:
    alpha = source.getchannel("A")
    counts = [sum(1 for value in alpha.crop((x, 0, x + 1, source.height)).get_flattened_data() if value >= 12)
              for x in range(source.width)]
    runs: list[list[int]] = []
    for x, count in enumerate(counts):
        if not count:
            continue
        if not runs or x > runs[-1][1] + 1:
            runs.append([x, x])
        else:
            runs[-1][1] = x

    minimum_width = max(10, source.width // 120)
    index = 0
    while index < len(runs):
        if runs[index][1] - runs[index][0] + 1 >= minimum_width or len(runs) <= expected:
            index += 1
            continue
        if index == 0:
            runs[1][0] = runs[0][0]
        else:
            runs[index - 1][1] = runs[index][1]
        runs.pop(index)

    while len(runs) < expected:
        widest_index = max(range(len(runs)), key=lambda i: runs[i][1] - runs[i][0])
        left, right = runs.pop(widest_index)
        lo = left + (right - left) // 3
        hi = right - (right - left) // 3
        split = min(range(lo, hi + 1), key=lambda x: counts[x])
        runs[widest_index:widest_index] = [[left, split], [split + 1, right]]

    while len(runs) > expected:
        merge_index = min(range(len(runs) - 1), key=lambda i: runs[i + 1][0] - runs[i][1])
        runs[merge_index:merge_index + 2] = [[runs[merge_index][0], runs[merge_index + 1][1]]]
    return [(left, right + 1) for left, right in runs]


def normalize_frame(source: Image.Image, left: int, right: int) -> Image.Image:
    frame = source.crop((left, 0, right, source.height)).convert("RGBA")
    alpha = frame.getchannel("A").point(lambda value: 255 if value >= 12 else 0)
    frame.putalpha(alpha)
    bbox = alpha.getbbox()
    output = Image.new("RGBA", CELL, (0, 0, 0, 0))
    if not bbox:
        return output
    subject = frame.crop(bbox)
    subject.thumbnail((176, 196), Image.Resampling.LANCZOS)
    x = (CELL[0] - subject.width) // 2
    y = CELL[1] - subject.height - 4
    output.alpha_composite(subject, (x, y))
    pixels = output.load()
    for py in range(output.height):
        for px in range(output.width):
            if pixels[px, py][3] == 0:
                pixels[px, py] = (0, 0, 0, 0)
    return output


def process(name: str, frames: int) -> Image.Image:
    source = Image.open(SOURCES / f"{name}-source.png").convert("RGBA")
    strip = Image.new("RGBA", (CELL[0] * frames, CELL[1]), (0, 0, 0, 0))
    for index, (left, right) in enumerate(subject_bounds(source, frames)):
        strip.alpha_composite(normalize_frame(source, left, right), (index * CELL[0], 0))
    strip.save(ACTIONS / f"{name}.webp", "WEBP", lossless=True, method=6)
    return strip


def main() -> None:
    strips = [(name, process(name, frames)) for name, frames in JOBS.items()]
    QA.parent.mkdir(parents=True, exist_ok=True)
    sheet = Image.new("RGBA", (CELL[0] * 8, len(strips) * (CELL[1] + 30)), (248, 244, 246, 255))
    draw = ImageDraw.Draw(sheet)
    for row, (name, strip) in enumerate(strips):
        y = row * (CELL[1] + 30)
        draw.text((8, y + 7), name, fill=(72, 30, 47, 255))
        sheet.alpha_composite(strip, (0, y + 30))
    sheet.save(QA)
    preview_dir = QA.parent / "previews" / "actions"
    preview_dir.mkdir(parents=True, exist_ok=True)
    for name, strip in strips:
        frames = [strip.crop((x, 0, x + CELL[0], CELL[1])).convert("RGBA")
                  for x in range(0, strip.width, CELL[0])]
        frames[0].save(preview_dir / f"{name}.gif", save_all=True, append_images=frames[1:],
                       duration=520, loop=0, disposal=2, transparency=0)
    validation = {"errors": [], "warnings": [], "actions": {}}
    for name, strip in strips:
        frames = JOBS[name]
        transparent_residue = sum(1 for r, g, b, a in strip.get_flattened_data() if a == 0 and (r or g or b))
        validation["actions"][name] = {
            "frames": frames,
            "width": strip.width,
            "height": strip.height,
            "transparent_rgb_residue": transparent_residue,
        }
        if strip.size != (CELL[0] * frames, CELL[1]):
            validation["errors"].append(f"{name}: invalid dimensions")
        if transparent_residue:
            validation["errors"].append(f"{name}: transparent RGB residue")
    (QA.parent / "action-validation.json").write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
