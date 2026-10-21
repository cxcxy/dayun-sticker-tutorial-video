#!/bin/bash
# 只录指定窗口的录屏开关（基于同目录 winrec.swift）
# 用法：
#   rec.sh build                         编译录屏工具到 ~/.cache/dayun-winrec/winrec
#   rec.sh start <输出目录> <片段名> <窗口ID>  开始录制 <输出目录>/<片段名>.mov
#   rec.sh stop                          停止当前录制
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
BIN="$HOME/.cache/dayun-winrec/winrec"
STOP="${TMPDIR:-/tmp}/dayun-winrec.stop"
case "$1" in
  build)
    mkdir -p "$(dirname "$BIN")"
    swiftc -O "$HERE/winrec.swift" -o "$BIN" && echo "已编译：$BIN" ;;
  start)
    [ -x "$BIN" ] || bash "$0" build
    out="$2"; name="$3"; wid="$4"
    [ -n "$out" ] && [ -n "$name" ] && [ -n "$wid" ] || { echo "用法：rec.sh start <输出目录> <片段名> <窗口ID>"; exit 2; }
    mkdir -p "$out"; rm -f "$STOP"
    nohup "$BIN" "$wid" "$out/$name.mov" "$STOP" > "$out/$name.log" 2>&1 &
    sleep 1.5; cat "$out/$name.log" ;;
  stop)
    touch "$STOP"; sleep 2.5; echo "已停止" ;;
  *) sed -n 2,6p "$0"; exit 2 ;;
esac
