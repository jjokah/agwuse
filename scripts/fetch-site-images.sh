#!/usr/bin/env bash
# Fetch real photography from the current production site (agwuse.org)
# into public/images/. Run from the repo root: bash scripts/fetch-site-images.sh
# Safe to re-run; files are overwritten in place.
set -euo pipefail

BASE="https://agwuse.org/web"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMG="$ROOT/public/images"

mkdir -p "$IMG/hero" "$IMG/sections" "$IMG/ministers" "$IMG/board" "$IMG/gallery"

fetch() {
  local src="$1" dest="$2"
  echo "  $src -> ${dest#"$ROOT/"}"
  curl -fsSL --retry 2 --max-time 60 -o "$dest" "$BASE/$src"
}

echo "Hero and section photos"
fetch "images/night_worship.jpg"                        "$IMG/hero/home-main.jpg"
fetch "images/sliders/children-sunday-school-2.jpg"     "$IMG/sections/children.jpg"
fetch "images/sliders/free_medical_outreach.jpg"        "$IMG/sections/outreach.jpg"
fetch "images/sliders/choir.jpg"                        "$IMG/sections/choir.jpg"
fetch "images/b1a.jpg"                                  "$IMG/sections/prayer-strip.jpg"
fetch "images/worship2.png"                             "$IMG/sections/church-building.png"

echo "Ministers (150x150 headshots; render small)"
fetch "images/m1.jpg"  "$IMG/ministers/anthony-eseh.jpg"
fetch "images/m2a.jpg" "$IMG/ministers/churchman-felix.jpg"
fetch "images/m3.jpg"  "$IMG/ministers/jeff-alex.jpg"

echo "Board elders (666x666 headshots)"
fetch "images/bb2.png" "$IMG/board/gabriel-ebemiele.png"
fetch "images/bb4.png" "$IMG/board/bernard-oshiogwehom.png"
fetch "images/bb5.png" "$IMG/board/emeka-onyiriuka.png"
fetch "images/bb6.png" "$IMG/board/peter-odeh.png"
fetch "images/bb7.png" "$IMG/board/solomon-achibong.png"

echo "Gallery originals (~1003x752)"
G="images/joomgallery/originals/ag_wuse_gallery_3"
fetch "$G/ag_wuse_1_20171015_1989088260.jpg"  "$IMG/gallery/ag-wuse-01.jpg"
fetch "$G/ag_wuse_2_20171015_1247985076.jpg"  "$IMG/gallery/ag-wuse-02.jpg"
fetch "$G/ag_wuse_3_20171015_1645352963.jpg"  "$IMG/gallery/ag-wuse-03.jpg"
fetch "$G/ag_wuse_4_20171015_2019432368.jpg"  "$IMG/gallery/ag-wuse-04.jpg"
fetch "$G/ag_wuse_5_20171015_1796852268.jpg"  "$IMG/gallery/ag-wuse-05.jpg"
fetch "$G/ag_wuse_6_20171015_1417563315.jpg"  "$IMG/gallery/ag-wuse-06.jpg"
fetch "$G/ag_wuse_7_20171015_1064388699.jpg"  "$IMG/gallery/ag-wuse-07.jpg"
fetch "$G/ag_wuse_8_20171015_1396759836.jpg"  "$IMG/gallery/ag-wuse-08.jpg"
fetch "$G/ag_wuse_9_20171015_1177729872.jpg"  "$IMG/gallery/ag-wuse-09.jpg"
fetch "$G/ag_wuse_10_20171015_1560858382.jpg" "$IMG/gallery/ag-wuse-10.jpg"
fetch "$G/ag_wuse_11_20171015_1636162930.jpg" "$IMG/gallery/ag-wuse-11.jpg"
fetch "$G/ag_wuse_12_20171015_2058938434.jpg" "$IMG/gallery/ag-wuse-12.jpg"

echo "Done."
