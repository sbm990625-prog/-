#!/usr/bin/env python3
"""렌더된 영상에서 검수용 프레임을 뽑아 장면별 컨택트 시트와 장면 경계 스트립을 만든다.

사용:
  python3 tools/review-frames.py out/neom-line.mp4 out/review-full

출력:
  <out>/frames/t_XXX.X.jpg        0.5초 간격 프레임 (960px)
  <out>/scene-<id>.png            장면별 컨택트 시트 (시간 라벨 포함)
  <out>/boundary-<i>-<a>__<b>.png 경계 앞뒤 ±0.4s 5장 스트립 (전환 검수용)
  <out>/overview.png              전체 영상 1초 간격 개요

필요: Pillow, 그리고 `npx remotion ffmpeg` (Remotion 번들 ffmpeg).
"""
from __future__ import annotations

import json
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def ffmpeg(*args: str) -> None:
    subprocess.run(["npx", "remotion", "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], check=True, cwd=ROOT)


def grab(video: str, t: float, out: str, width: int = 960) -> None:
    ffmpeg("-ss", f"{t:.3f}", "-i", video, "-frames:v", "1", "-vf", f"scale={width}:-2", "-q:v", "3", out)


def font(size: int) -> ImageFont.ImageFont:
    for p in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def sheet(paths: list[tuple[str, str]], out: str, cols: int = 4, width: int = 480) -> None:
    ims = [(Image.open(p).convert("RGB"), label) for p, label in paths if os.path.exists(p)]
    if not ims:
        return
    h = int(width * ims[0][0].height / ims[0][0].width)
    rows = (len(ims) + cols - 1) // cols
    canvas = Image.new("RGB", (cols * width, rows * (h + 26)), (12, 12, 16))
    draw = ImageDraw.Draw(canvas)
    f = font(18)
    for i, (im, label) in enumerate(ims):
        x, y = (i % cols) * width, (i // cols) * (h + 26)
        canvas.paste(im.resize((width, h), Image.LANCZOS), (x, y + 26))
        draw.text((x + 6, y + 3), label, fill=(255, 220, 120), font=f)
    canvas.save(out)


def main() -> None:
    video = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "out", "neom-line.mp4")
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "out", "review-full")
    os.makedirs(os.path.join(out, "frames"), exist_ok=True)
    sb = json.load(open(os.path.join(ROOT, "docs", "storyboard.json")))
    scenes = sb["scenes"]
    total = scenes[-1]["endSec"]

    # 0.5초 간격 프레임
    times = [round(i * 0.5 + 0.25, 2) for i in range(int(total / 0.5))]
    for t in times:
        p = os.path.join(out, "frames", f"t_{t:05.1f}.jpg")
        if not os.path.exists(p):
            grab(video, t, p)

    # 장면별 시트
    for s in scenes:
        ts = [t for t in times if s["startSec"] <= t < s["endSec"]]
        paths = [(os.path.join(out, "frames", f"t_{t:05.1f}.jpg"), f'{s["id"]}  {t:.2f}s') for t in ts]
        sheet(paths, os.path.join(out, f'scene-{s["id"]}.png'))

    # 경계 스트립 (±0.4s)
    for i in range(1, len(scenes)):
        b = scenes[i]["startSec"]
        paths = []
        for dt in (-0.4, -0.2, -0.05, 0.05, 0.2, 0.4):
            t = max(0, min(total - 0.04, b + dt))
            p = os.path.join(out, "frames", f"b_{t:06.2f}.jpg")
            if not os.path.exists(p):
                grab(video, t, p)
            paths.append((p, f"{t:.2f}s ({dt:+.2f})"))
        sheet(paths, os.path.join(out, f'boundary-{i:02d}-{scenes[i-1]["id"]}__{scenes[i]["id"]}.png'), cols=6, width=400)

    # 개요 (1초 간격)
    paths = [(os.path.join(out, "frames", f"t_{t:05.1f}.jpg"), f"{t:.1f}s") for t in times if abs((t - 0.25) % 1.0) < 1e-6]
    sheet(paths, os.path.join(out, "overview.png"), cols=10, width=240)
    print(f"wrote review material to {out}")


if __name__ == "__main__":
    main()
