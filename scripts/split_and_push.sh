#!/bin/bash
# 把工程里超过 4MB 的大文件切块存到 assets-parts/，逐个提交并推送（网络对大上传不稳时用）
# 前提：工程已 git init 并设置好 origin；会把原大文件写进 .gitignore
# 用法：split_and_push.sh <工程目录> [<额外大文件> ...]
set -e
prj="$1"; shift; cd "$prj"
HERE="$(cd "$(dirname "$0")" && pwd)"
T=$'\n\nCo-Authored-By: Claude <noreply@anthropic.com>'
git config http.postBuffer 16777216
mkdir -p scripts; cp "$HERE/assemble-assets.sh" scripts/
big=$(find . -path ./node_modules -prune -o -path ./.git -prune -o -path ./assets-parts -prune -o -path ./build -prune -o -path ./out -prune -o -type f -size +4M -print | sed 's|^\./||')
for f in $big "$@"; do
  [ -f "$f" ] || continue
  dir="assets-parts/$f.parts"; mkdir -p "$dir"
  [ -n "$(ls "$dir" 2>/dev/null | grep part-)" ] || split -b 4m -a 3 "$f" "$dir/part-"
  shasum -a 256 "$f" | cut -d' ' -f1 > "$dir/sha256"
  grep -qxF "$f" .gitignore 2>/dev/null || echo "$f" >> .gitignore
done
pushsha() { for i in $(seq 1 10); do git push origin "$1:refs/heads/main" >/tmp/dayun-push.out 2>&1 && return 0; sleep $((i*4)); done; cat /tmp/dayun-push.out; return 1; }
pushpending() { for sha in $(git rev-list --reverse origin/main..main 2>/dev/null || git rev-list --reverse main); do pushsha "$sha" || return 1; git fetch -q origin; done; }
git add .gitignore scripts && git commit -q -m "大文件改为切块存放，附还原脚本$T" 2>/dev/null || true
pushpending
for part in $(find assets-parts -type f -name 'part-*' | sort); do
  [ -n "$(git ls-files "$part")" ] && continue
  git add "$part" "$(dirname "$part")/sha256"
  git commit -q -m "素材切块：${part#assets-parts/}$T"
  pushpending && echo "OK ${part#assets-parts/}"
done
git fetch -q origin; echo "完成：未推送 $(git rev-list --count origin/main..main) 个提交"
