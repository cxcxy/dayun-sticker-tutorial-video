#!/bin/bash
# 渲染指定秒数的静帧并拼成 3×3 检查图（先在工程里 npx remotion bundle --out-dir build）
# 用法：stills_check.sh <工程目录> <合成ID> <秒> [<秒> ...]   输出：<工程目录>/out/stills/check-N.jpg
set -e
prj="$1"; comp="$2"; shift 2
cd "$prj"; mkdir -p out/stills
files=()
for t in "$@"; do
  fr=$(python3 -c "print(round($t*30))")
  npx remotion still build "$comp" "out/stills/s$t.jpg" --frame="$fr" --scale=0.5 --image-format=jpeg > /dev/null
  files+=("out/stills/s$t.jpg")
done
k=0
while [ ${#files[@]} -gt 0 ]; do
  grp=("${files[@]:0:9}"); files=("${files[@]:9}")
  while [ ${#grp[@]} -lt 9 ]; do grp+=("${grp[${#grp[@]}-1]}"); done
  args=(); for g in "${grp[@]}"; do args+=(-i "$g"); done
  fc=""; for i in $(seq 0 8); do fc+="[$i:v]scale=640:-2[v$i];"; done
  fc+="[v0][v1][v2][v3][v4][v5][v6][v7][v8]xstack=inputs=9:layout=0_0|w0_0|w0+w1_0|0_h0|w0_h0|w0+w1_h0|0_h0+h1|w0_h0+h1|w0+w1_h0+h1[o]"
  ffmpeg -v error -y "${args[@]}" -filter_complex "$fc" -map "[o]" "out/stills/check-$k.jpg"
  echo "out/stills/check-$k.jpg"; k=$((k+1))
done
