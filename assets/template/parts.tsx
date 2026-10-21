import React from "react";
import { Easing, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT_BODY, clamp, softSpring, PointChip, StickerText, Pill } from "../lib";

export const FPS = 30;
export const f = (sec: number) => Math.round(sec * FPS);
export const K = 0.56; // 动画力度，与开场 C 保持一致

// ===== 录屏卡片：贴纸风屏幕框 =====
export const CARD = { x: 240, y: 40, w: 1440, h: 800 };

// 镜头关键帧：[相对秒, x, y, w]（源视频像素，h = w / 卡片宽高比）
export type CamKey = [number, number, number, number];
export type Rect = [number, number, number, number];

const camAt = (keys: CamKey[], t: number) => {
  if (t <= keys[0][0]) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, ...a] = keys[i - 1];
      const [t1, ...b] = keys[i];
      const p = Easing.inOut(Easing.cubic)((t - t0) / (t1 - t0));
      return [t, a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p] as CamKey;
    }
  }
  return keys[keys.length - 1];
};

export type Shot = {
  clip: string; // c01 ...
  sw: number; // 源宽
  sh: number; // 源有效高
  src: number; // 从源视频第几秒开始
  rate: number;
  cam: CamKey[];
  blur?: Rect[]; // 需要模糊的区域（源像素）
};

// 在 Sequence 内使用：frame 从 0 开始
export const Footage: React.FC<{ shot: Shot; label?: string }> = ({ shot, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const [, cx0, cy0, cw0] = camAt(shot.cam, t);
  const ratio = CARD.w / CARD.h;
  const cw = Math.min(cw0, shot.sw);
  const ch = cw / ratio;
  const cx = Math.max(0, Math.min(cx0, shot.sw - cw));
  const cy = Math.max(0, Math.min(cy0, shot.sh - ch));
  const s = CARD.w / cw;
  return (
    <div
      style={{
        position: "absolute",
        left: CARD.x,
        top: CARD.y,
        width: CARD.w,
        height: CARD.h,
        borderRadius: 26,
        border: `7px solid ${C.ink}`,
        boxShadow: `12px 12px 0 ${C.ink}`,
        background: C.white,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${-cx * s}px, ${-cy * s}px) scale(${s})` }}>
        <OffthreadVideo
          src={staticFile(`clips/${shot.clip}.mp4`)}
          trimBefore={Math.round(shot.src * fps)}
          playbackRate={shot.rate}
          muted
          style={{ display: "block" }}
        />
        {(shot.blur ?? []).map(([x, y, w, h], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: w,
              height: h,
              borderRadius: 18,
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              background: "rgba(244,241,234,0.45)",
            }}
          />
        ))}
      </div>
      {label ? (
        <div style={{ position: "absolute", left: 18, top: 16 }}>
          <Pill fontSize={30} shadowColor={C.purple}>
            {label}
          </Pill>
        </div>
      ) : null}
    </div>
  );
};

// 录屏卡片入场：轻微缩放弹出
export const CardIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = softSpring(frame, fps, 0, K, { damping: 12 });
  const sc = interpolate(p, [0, 1], [0.94, 1]);
  return (
    <div style={{ position: "absolute", inset: 0, transformOrigin: "960px 440px", transform: `scale(${sc})`, opacity: Math.min(1, p * 3) }}>
      {children}
    </div>
  );
};

// ===== 弹出工具：at 为相对当前 Sequence 的秒 =====
export const usePop = (at: number, damping = 10) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return softSpring(frame, fps, f(at), K, { damping });
};

export const Pop: React.FC<{
  at: number;
  x: number;
  y: number;
  rotate?: number;
  origin?: string;
  children: React.ReactNode;
}> = ({ at, x, y, rotate = 0, origin = "50% 50%", children }) => {
  const p = usePop(at);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transformOrigin: origin,
        transform: `scale(${p}) rotate(${rotate * p}deg)`,
        opacity: Math.min(1, p * 2),
      }}
    >
      {children}
    </div>
  );
};

// 白底粗边贴纸标签（与开场 C 的钩子同款）
export const Tag: React.FC<{ children: React.ReactNode; fontSize?: number; bg?: string; color?: string }> = ({
  children,
  fontSize = 52,
  bg = C.white,
  color = C.ink,
}) => (
  <div
    style={{
      background: bg,
      border: `6px solid ${C.ink}`,
      borderRadius: 22,
      boxShadow: `8px 8px 0 ${C.ink}`,
      padding: "8px 30px",
      fontFamily: FONT_BODY,
      fontWeight: 900,
      fontSize,
      color,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);

// 画面上的强调贴纸：在 [from, to) 秒内出现（相对 Sequence）
export const Callout: React.FC<{ from: number; to: number; x: number; y: number; text: string; bg?: string; rotate?: number }> = ({
  from,
  to,
  x,
  y,
  text,
  bg = C.yellow,
  rotate = -3,
}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t < from || t >= to) return null;
  const out = interpolate(t, [to - 0.2, to], [1, 0], clamp);
  return (
    <div style={{ opacity: out }}>
      <Pop at={from} x={x} y={y} rotate={rotate} origin="0% 50%">
        <Tag fontSize={46} bg={bg}>
          {text}
        </Tag>
      </Pop>
    </div>
  );
};

// 板书场景的大标题
export const Title: React.FC<{ at: number; text: string; y?: number; size?: number }> = ({ at, text, y = 90, size = 120 }) => {
  const p = usePop(at);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center" }}>
      <div style={{ transform: `scale(${p}) rotate(${-1.5 * p}deg)`, opacity: Math.min(1, p * 2) }}>
        <StickerText text={text} fontSize={size} />
      </div>
    </div>
  );
};

const DOTS = [C.green, C.purple, C.yellow, C.pink];

// 一排依次弹出的要点胶囊
export const Chips: React.FC<{ items: [number, string][]; y: number; fontSize?: number; gap?: number; numbered?: boolean }> = ({
  items,
  y,
  fontSize = 56,
  gap = 34,
  numbered = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", gap, flexWrap: "wrap" }}>
      {items.map(([at, text], i) => {
        const p = softSpring(frame, fps, f(at), K, { damping: 10 });
        return (
          <PointChip
            key={i}
            index={numbered ? i + 1 : 0}
            text={text}
            dotColor={DOTS[i % DOTS.length]}
            fontSize={fontSize}
            style={{ transform: `translateY(${(1 - p) * 50}px) scale(${p})`, opacity: Math.min(1, p * 2) }}
          />
        );
      })}
    </div>
  );
};

// 白色贴纸面板
export const Panel: React.FC<{ x: number; y: number; w: number; h: number; at: number; children: React.ReactNode; rotate?: number }> = ({
  x,
  y,
  w,
  h,
  at,
  children,
  rotate = 0,
}) => {
  const p = usePop(at, 12);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        background: C.white,
        border: `7px solid ${C.ink}`,
        borderRadius: 30,
        boxShadow: `12px 12px 0 ${C.ink}`,
        transform: `scale(${p}) rotate(${rotate}deg)`,
        opacity: Math.min(1, p * 2),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
      }}
    >
      {children}
    </div>
  );
};

export const Body: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 52, color = C.ink }) => (
  <div style={{ fontFamily: FONT_BODY, fontWeight: 900, fontSize: size, color, textAlign: "center", lineHeight: 1.35 }}>{children}</div>
);

// 简笔电脑图标
export const Laptop: React.FC<{ on: boolean; scale?: number }> = ({ on, scale = 1 }) => (
  <div style={{ width: 300 * scale, height: 210 * scale, position: "relative" }}>
    <div
      style={{
        position: "absolute",
        left: 30 * scale,
        top: 0,
        width: 240 * scale,
        height: 160 * scale,
        borderRadius: 14 * scale,
        border: `7px solid ${C.ink}`,
        background: on ? C.screen : "#cfcac0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {on ? <div style={{ width: 40 * scale, height: 40 * scale, borderRadius: "50%", background: C.green }} /> : null}
    </div>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 160 * scale,
        width: 300 * scale,
        height: 36 * scale,
        borderRadius: 10 * scale,
        border: `7px solid ${C.ink}`,
        background: C.purple,
      }}
    />
  </div>
);

// 简笔云朵
export const Cloud: React.FC<{ scale?: number; children?: React.ReactNode }> = ({ scale = 1, children }) => {
  const b = (l: number, t: number, d: number): React.CSSProperties => ({
    position: "absolute",
    left: l * scale,
    top: t * scale,
    width: d * scale,
    height: d * scale,
    borderRadius: "50%",
    background: C.white,
    border: `7px solid ${C.ink}`,
  });
  return (
    <div style={{ width: 340 * scale, height: 220 * scale, position: "relative" }}>
      <div style={b(20, 80, 130)} />
      <div style={b(90, 20, 170)} />
      <div style={b(190, 70, 130)} />
      <div
        style={{
          position: "absolute",
          left: 40 * scale,
          top: 120 * scale,
          width: 260 * scale,
          height: 95 * scale,
          background: C.white,
          borderBottom: `7px solid ${C.ink}`,
          borderRadius: `0 0 ${40 * scale}px ${40 * scale}px`,
        }}
      />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 60 * scale }}>
        {children}
      </div>
    </div>
  );
};

// 简笔文件夹
export const Folder: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <div style={{ position: "relative", width: 230, height: 170 }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 100, height: 40, background: color, border: `6px solid ${C.ink}`, borderRadius: "14px 14px 0 0" }} />
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 28,
        width: 230,
        height: 142,
        background: color,
        border: `6px solid ${C.ink}`,
        borderRadius: 16,
        boxShadow: `6px 6px 0 ${C.ink}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_BODY,
        fontWeight: 900,
        fontSize: 40,
        color: C.ink,
      }}
    >
      {label}
    </div>
  </div>
);

export const Arrow: React.FC<{ size?: number }> = ({ size = 70 }) => (
  <div style={{ fontFamily: FONT_BODY, fontWeight: 900, fontSize: size, color: C.ink, lineHeight: 1 }}>→</div>
);

// 右下角小字说明（如“示意图”）
export const Note: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      position: "absolute",
      right: 60,
      top: 40,
      fontFamily: FONT_BODY,
      fontWeight: 700,
      fontSize: 30,
      color: C.ink,
      opacity: 0.55,
    }}
  >
    {text}
  </div>
);
