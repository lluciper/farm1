#!/usr/bin/env bash
# Turns an AI-generated picture on a flat chroma background into a game-ready transparent PNG.
#   tools/art/key-and-fit.sh <input> <output.png> <width> <height> [key colour, default #00FF00] [margin %, default 8]
# Removes the flat background (and its colour fringe), trims to the subject, keeps the aspect ratio and centres it
# on a transparent canvas of exactly <width>x<height>, standing on the bottom margin like the existing art.
set -euo pipefail
in="$1"; out="$2"; W="$3"; H="$4"; key="${5:-#00FF00}"; margin="${6:-8}"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

# 1. Key out the background colour; 22% fuzz catches the soft edge the generator paints around the subject.
magick "$in" -alpha set -fuzz 22% -transparent "$key" "$tmp/keyed.png"
# 2. Shave one pixel of semi-transparent fringe and remove the leftover key-colour cast on edge pixels.
magick "$tmp/keyed.png" \( +clone -alpha extract -morphology Erode Disk:1 \) -compose CopyOpacity -composite \
  -channel RGB -fuzz 30% -fill '#5A3920' -opaque "$key" +channel "$tmp/clean.png"
# 3. Trim to the subject and fit it inside the margin, feet on the bottom margin.
magick "$tmp/clean.png" -trim +repage "$tmp/trim.png"
inner_w=$(( W * (100 - 2 * margin) / 100 )); inner_h=$(( H * (100 - 2 * margin) / 100 ))
magick "$tmp/trim.png" -resize "${inner_w}x${inner_h}" "$tmp/fit.png"
pad=$(( H * margin / 100 ))
magick -size "${W}x${H}" xc:none "$tmp/fit.png" -gravity south -geometry "+0+${pad}" -composite -strip "$out"
echo "$out: $(magick identify -format '%wx%h' "$out")"
