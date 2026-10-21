# 素材说明

- `template/parts.tsx`：放进 dy-video-kit 工程的 `src/ep/`，提供录屏卡（Footage + 镜头关键帧 + 隐私模糊）、强调贴纸（Callout）、板书组件（Title、Chips、Panel、Tag）和简笔图（Laptop、Cloud、Folder、Arrow、Note）。依赖 `../lib`。
- `example/ExampleEpisode.tsx`：一期完整软件教程的场景表，写新一期时照着改；它依赖同目录的 `parts.tsx` 和由 `scripts/align.py --emit-ts` 生成的 `captions.ts`。
- `example/style-sheet.jpg`：成片 6 张样帧（开场、误解 vs 其实、功能录屏、任务录屏、网页成品、习惯行）。
