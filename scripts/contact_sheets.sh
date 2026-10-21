#!/bin/bash
# 为每段录屏生成 4×4 缩略拼图，用来挑时间点。第 i 格（从 0 数）≈ i × step 秒
# 用法：contact_sheets.sh <clips目录> <输出目录>
set -e
in="$1"; out="$2"; mkdir -p "$out"
for f in "$in"/*.mp4; do
  n=$(basename "$f" .mp4)
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  step=$(python3 -c "import math;print(max(1.0, math.ceil($dur/16*10)/10))")
  ffmpeg -v error -y -i "$f" -vf "fps=1/$step,scale=480:-2,tile=4x4:padding=4:color=red" -frames:v 1 "$out/$n.jpg"
  echo "$n 时长=${dur}s step=${step}s 尺寸=$(ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 "$f")"
done
