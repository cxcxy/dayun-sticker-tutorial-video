"""把逐字稿和 whisper 逐词时间戳对齐，输出字幕行与句子时间（秒）。
用法:
  python3 align.py <逐字稿.txt> <asr_tokens.json> <输出 timeline.json>
  python3 align.py --emit-ts <timeline.json> <输出 captions.ts>   生成 Remotion 字幕数据
"""
import difflib
import json
import re
import sys

if sys.argv[1] == "--emit-ts":
    d = json.load(open(sys.argv[2], encoding="utf-8"))
    caps = [{"t": c["text"], "s": c["start"], "e": c["end"]} for c in d["captions"]]
    open(sys.argv[3], "w", encoding="utf-8").write(
        "// 由 timeline.json 生成：字幕行与配音时间（秒）\nexport const CAPTIONS: { t: string; s: number; e: number }[] = "
        + json.dumps(caps, ensure_ascii=False, indent=0) + ";\n")
    print("captions", len(caps))
    sys.exit(0)

script_path, asr_path, out_path = sys.argv[1:4]
script = open(script_path, encoding="utf-8").read().strip()
tokens = json.load(open(asr_path, encoding="utf-8"))["transcription"]

KEEP = re.compile(r"[一-鿿A-Za-z0-9]")

# ASR 字符级时间：token 时间在其字符间均分
asr_chars, asr_t = [], []
for tk in tokens:
    chars = [c for c in tk["text"] if KEEP.match(c)]
    if not chars:
        continue
    a, b = tk["offsets"]["from"] / 1000, tk["offsets"]["to"] / 1000
    step = (b - a) / len(chars)
    for i, c in enumerate(chars):
        asr_chars.append(c.lower())
        asr_t.append((a + i * step, a + (i + 1) * step))

# 稿子字符（保留原位置，便于切字幕）
s_idx = [i for i, c in enumerate(script) if KEEP.match(c)]
s_chars = [script[i].lower() for i in s_idx]

sm = difflib.SequenceMatcher(None, s_chars, asr_chars, autojunk=False)
start = [None] * len(s_chars)
end = [None] * len(s_chars)
for blk in sm.get_matching_blocks():
    for k in range(blk.size):
        start[blk.a + k], end[blk.a + k] = asr_t[blk.b + k]

# 未匹配的字线性插值
known = [i for i, v in enumerate(start) if v is not None]
for i in range(len(start)):
    if start[i] is not None:
        continue
    prev = max([k for k in known if k < i], default=None)
    nxt = min([k for k in known if k > i], default=None)
    if prev is None:
        start[i] = end[i] = start[nxt]
    elif nxt is None:
        start[i] = end[i] = end[prev]
    else:
        f = (i - prev) / (nxt - prev)
        t = end[prev] + (start[nxt] - end[prev]) * f
        start[i] = end[i] = t
matched = len(known) / len(s_chars)

pos2k = {p: k for k, p in enumerate(s_idx)}


def span_time(a, b):
    ks = [pos2k[p] for p in range(a, b) if p in pos2k]
    return round(start[ks[0]], 3), round(end[ks[-1]], 3)


# 句子：按 。？ 切
sentences = []
for m in re.finditer(r"[^。？]+[。？]", script):
    s0, s1 = span_time(m.start(), m.end())
    sentences.append({"text": m.group(), "start": s0, "end": s1, "pos": m.start()})

# 字幕行：句内按逗号切，每行不超过 18 个字
captions = []
for s in sentences:
    parts = re.findall(r"[^，]+[，。？]?", s["text"])
    line, lstart = "", s["pos"]
    cur = s["pos"]
    buf = []
    for p in parts:
        if buf and len("".join(buf) + p) > 18:
            txt = "".join(buf)
            a, b = span_time(lstart, lstart + len(txt))
            captions.append({"text": txt.rstrip("，。？"), "start": a, "end": b})
            lstart += len(txt)
            buf = []
        buf.append(p)
    if buf:
        txt = "".join(buf)
        a, b = span_time(lstart, lstart + len(txt))
        captions.append({"text": txt.rstrip("，。？"), "start": a, "end": b})

json.dump({"matched_ratio": round(matched, 3), "sentences": sentences, "captions": captions},
          open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("matched", round(matched, 3), "sentences", len(sentences), "captions", len(captions))
