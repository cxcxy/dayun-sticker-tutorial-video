#!/bin/bash
# 把 assets-parts/ 里切成小块的大文件拼回原位置（clone 之后运行一次）
# 用法：bash scripts/assemble-assets.sh
set -e
cd "$(dirname "$0")/.."
for dir in $(find assets-parts -name '*.parts' -type d | sort); do
  rel="${dir#assets-parts/}"; target="${rel%.parts}"
  if [ -f "$target" ]; then echo "已存在：$target"; continue; fi
  mkdir -p "$(dirname "$target")"
  cat "$dir"/part-* > "$target"
  if [ -f "$dir/sha256" ]; then
    want=$(cat "$dir/sha256"); got=$(shasum -a 256 "$target" | cut -d' ' -f1)
    [ "$want" = "$got" ] || { echo "校验失败：$target"; rm -f "$target"; exit 1; }
  fi
  echo "已还原：$target"
done
