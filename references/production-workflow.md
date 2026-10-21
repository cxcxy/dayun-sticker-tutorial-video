# 制作流程：从逐字稿到成片

每一步都有产物和检查点。`SKILL` 指本 Skill 目录，`EP` 指当期桌面目录 `~/Desktop/抖音视频/YYYY-MM-DD_HH-mm_主题/`，`PRJ` 指当期工程 `EP/成片工程/`。

## 0. 准备工程

1. 复制组件库：`rsync -a --exclude .git --exclude node_modules <dy-video-kit> PRJ/`（用户仓库 `cxcxy/dy-video-kit`；本机已有克隆就用本机的，没有就 `gh repo clone`）。
2. 新建 `PRJ/src/ep/`，复制 `SKILL/assets/template/parts.tsx`，参照 `SKILL/assets/example/MuseEpisode.tsx` 写当期 `Episode.tsx`，在 `Root.tsx` 的“成片”文件夹注册。
3. `npm i`。不改 `src/lib/` 和 `episode.ts`、`channel.ts`（片头内容是用户的）。

## 1. 文稿与配音

- 文稿：按 `write-dayun-talking-scripts` 或用户给的风格写；教程类按“怎么用 → 全部功能 → 生活/工作实操”三段。
- 配音：用户要求本人音色时用 `dayun-doubao-clone-self`；整篇一次合成，按段落写语气标记。
- 产物：`EP/逐字稿.txt`、`EP/配音/*.mp3`。实测时长后再定画面。

## 2. 录屏（真实操作被讲解的软件）

1. 编译录屏工具：`bash SKILL/scripts/rec.sh build`（ScreenCaptureKit，只录指定窗口，原生 2 倍分辨率，窗口被遮挡也能录）。
2. 用 computer-use 申请目标 App 权限，`app_list_windows` 拿 window_id。弹出的独立窗口（设置等）有自己的 id 和尺寸，要单独录。
3. 一个功能一段：`rec.sh start EP/录屏 01_动态 <window_id>` → 操作 → `rec.sh stop`。名字用“两位序号_内容”。
4. 后台点击无效或弹窗关不掉时，申请全屏控制；中文输入在后台常失败，用全屏的 `type`。
5. 发需求类演示：先录“新建对话 → 输入 → 发送”，任务在云端跑时另录下一个；结果出来后回来补录“结果”片段。
6. 边界：不替用户登录、不过验证码、不付款、不点删除；批准卡、发送邮件、定时任务等先停下问用户。录前看一眼画面里有没有私人内容。
7. 产物：`EP/录屏/*.mov` + 每段的开始时间日志。

## 3. 素材整理

1. 转恒定帧率：`ffmpeg -i x.mov -vf "fps=30,format=yuv420p" -c:v libx264 -crf 14 -an PRJ/public/clips/cNN.mp4`（ScreenCaptureKit 是可变帧率，直接用会跳帧）。
2. 每段做 4×4 缩略拼图找时间点：`bash SKILL/scripts/contact_sheets.sh PRJ/public/clips EP/时间轴/sheets`，第 i 格的时间 = i × 输出里给的 step。
3. 记下每段的源尺寸：主窗口通常 2150×1600，设置窗口 1600×1200；中途窗口被拉宽时内容按比例缩放、下方出黑边，`sh` 取实际内容高度。

## 4. 字幕时间轴

1. `ffmpeg -i 配音.mp3 -ar 16000 -ac 1 /tmp/vo16.wav`
2. `whisper-cli -m ~/.cache/whisper/ggml-base.bin -l zh --prompt "以下是普通话简体中文的句子。" -f /tmp/vo16.wav -ml 1 -oj -of EP/时间轴/asr_tokens`（不加简体提示会输出繁体，导致对齐失败）。
3. `python3 SKILL/scripts/align.py EP/逐字稿.txt EP/时间轴/asr_tokens.json EP/时间轴/timeline.json`，看输出的匹配率（≥0.9 正常）和每句时间。
4. 某句时长接近 0 或后面整体漂移时，截出那 30–40 秒单独转写，用停顿检测校准，再手动改 `timeline.json`。
5. `python3 SKILL/scripts/align.py --emit-ts EP/时间轴/timeline.json PRJ/src/ep/captions.ts` 生成字幕数据。

## 5. 场景表

按 `scene-playbook.md` 把每句口播分配到一个场景，写成 `SCENES` 数组（`a`、`b` 是绝对秒）。规则：

- 场景边界对齐句子边界；元素出现时间对齐关键词时间（相对场景开始的秒）。
- 录屏场景用 `Shots`，每个镜头 `[开始, 结束, s(clip, 源秒, 速度, 关键帧, 模糊区)]`。录屏比口播短就降速（0.15–0.8），长就截取。
- 私人内容（对话列表、历史记录、和用户工作相关的条目）一律放进 `blur`；Muse 主窗口的旁聊列表区是 `[195, 262, 440, 610]`。

## 6. 预览与验收

1. `npx tsc --noEmit && npx eslint src/ep`
2. `npx remotion bundle --out-dir build`，再用 `bash SKILL/scripts/stills_check.sh PRJ <秒> <秒> ...` 出 3×3 静帧拼图，逐张看：镜头是否对准、打字和结果是否在画面里、模糊是否盖住私人内容、贴纸是否挡字。
3. 改完只重渲有问题的帧，确认后再渲全片：`npx remotion render build <Id> ../成片.mp4 --codec=h264 --crf=17 --concurrency=4 --timeout=120000`（并发 6 时高清录屏解帧会断连超时）。
4. 成片检查：`ffprobe` 规格时长、`ffmpeg -f null` 完整解码、loudnorm 响度、按场景抽 8 帧拼图目视。
5. 交付：`EP/` 下放成片、逐字稿、制作记录（录屏清单、隐私处理、未实测项、仍在运行的任务）。

## 7. 上传 GitHub（用户要求时）

- 建私有仓库：录屏和配音含私人信息。
- 网络对单次大上传不稳时：`bash SKILL/scripts/split_and_push.sh PRJ` 把超过 4MB 的文件切块到 `assets-parts/`，逐个提交推送；仓库里带 `scripts/assemble-assets.sh`，clone 后运行一次拼回原文件（sha256 校验）。
- 推送前把仓库 `http.postBuffer` 设为 16MB；一次只推一个提交。
- 最后全新 clone 一份，跑还原脚本，核对文件数、成片时长。
