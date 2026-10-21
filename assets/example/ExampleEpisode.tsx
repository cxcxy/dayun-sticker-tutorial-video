// 范例：一期完整的横版软件教程（贴纸风），写新一期时照着改场景表、镜头和文案
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { channel } from "../channel";
import { episode } from "../episode";
import { C, FONT_BODY, GroundShadow, OpeningC, OPENING_C_FRAMES, PaperBackground, PlacedRobot, PlacedSparkle, SpeechBubble, StickerText, Pill, type Eyes } from "../lib";
import { CAPTIONS } from "./captions";
import {
  Arrow,
  Body,
  CardIn,
  Callout,
  Chips,
  Cloud,
  f,
  Folder,
  Footage,
  FPS,
  Laptop,
  Note,
  Panel,
  Pop,
  Tag,
  Title,
  usePop,
  type Rect,
  type Shot,
} from "./parts";

// 当期讲解的产品名：画面文字统一从这里取
const PRODUCT = "产品名";

export const EP_END = 327.2; // 秒
export const EP_FRAMES = f(EP_END);

// ===== 源视频尺寸与隐私遮挡 =====
const W = 2150;
const H = 1600;
const LIST: Rect = [195, 262, 440, 610]; // 旁聊列表（你的私人对话标题）
const s = (clip: string, src: number, rate: number, cam: Shot["cam"], blur: Rect[] = [LIST], sw = W, sh = H): Shot => ({
  clip,
  sw,
  sh,
  src,
  rate,
  cam,
  blur,
});

// ===== 字幕 =====
const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let cur: (typeof CAPTIONS)[number] | null = null;
  for (let i = 0; i < CAPTIONS.length; i++) {
    const c = CAPTIONS[i];
    const next = CAPTIONS[i + 1];
    const end = next && next.s - c.e < 0.6 ? next.s : c.e + 0.25;
    if (t >= c.s - 0.05 && t < end) {
      cur = c;
      break;
    }
  }
  if (!cur || t < OPENING_C_FRAMES / FPS - 0.2) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          background: C.white,
          border: `6px solid ${C.ink}`,
          borderRadius: 20,
          boxShadow: `7px 7px 0 ${C.ink}`,
          padding: "6px 34px",
          fontFamily: FONT_BODY,
          fontWeight: 900,
          fontSize: 50,
          color: C.ink,
          whiteSpace: "nowrap",
        }}
      >
        {cur.t}
      </div>
    </div>
  );
};

// ===== 板书场景里的机器人 =====
const Bot: React.FC<{ cx?: number; bottom?: number; scale?: number; eyes?: Eyes; at?: number }> = ({
  cx = 1660,
  bottom = 900,
  scale = 0.9,
  eyes = "ring",
  at = 0,
}) => {
  const frame = useCurrentFrame();
  const p = usePop(at, 9);
  const bob = Math.sin(frame / 7) * 6;
  const blink = frame % 90 < 4 ? "blink" : eyes;
  return (
    <>
      <GroundShadow cx={cx} y={bottom - 8} width={300 * scale} opacity={0.15} />
      <PlacedRobot
        cx={cx}
        bottom={bottom}
        scale={scale * p}
        offsetY={bob}
        rotate={Math.sin(frame / 11) * 3}
        eyes={blink as Eyes}
        handleAngle={Math.sin(frame / 5) * 6}
        showLines={frame % 30 < 14}
      />
    </>
  );
};

const Sparkles: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {[
        { x: 120, y: 120, s: 54, c: C.yellow },
        { x: 1800, y: 120, s: 44, c: C.green },
        { x: 110, y: 820, s: 40, c: C.purple },
      ].map((p, i) => (
        <PlacedSparkle key={i} x={p.x} y={p.y} size={p.s} color={p.c} scale={0.9 + Math.sin(frame / 9 + i) * 0.1} />
      ))}
    </>
  );
};

// ===== 小部件 =====
const BubbleAt: React.FC<{ at: number; x: number; y: number; rotate: number; text: string }> = ({ at, x, y, rotate, text }) => {
  const p = usePop(at);
  return (
    <SpeechBubble x={x} y={y} scale={p} fontSize={52} origin="0% 100%" rotate={rotate}>
      {text}
    </SpeechBubble>
  );
};

const StrikeOut: React.FC<{ at: number }> = ({ at }) => {
  const p = usePop(at, 14);
  return (
    <div
      style={{
        position: "absolute",
        left: 170,
        top: 440,
        width: 700 * p,
        height: 18,
        background: C.pink,
        border: `5px solid ${C.ink}`,
        borderRadius: 10,
        transform: "rotate(-12deg)",
        transformOrigin: "0 50%",
      }}
    />
  );
};

const StepTag: React.FC<{ at: number; text: string; bg?: string }> = ({ at, text, bg = C.white }) => {
  const p = usePop(at);
  return (
    <div style={{ transform: `scale(${p})`, opacity: Math.min(1, p * 2) }}>
      <Tag fontSize={50} bg={bg}>
        {text}
      </Tag>
    </div>
  );
};

const ArrowPop: React.FC<{ at: number }> = ({ at }) => {
  const p = usePop(at);
  return <div style={{ transform: `scale(${p})`, opacity: Math.min(1, p * 2) }}>{<Arrow />}</div>;
};

const FolderPop: React.FC<{ at: number; label: string; color: string }> = ({ at, label, color }) => {
  const p = usePop(at);
  return (
    <div style={{ transform: `translateY(${(1 - p) * 40}px) scale(${p})`, opacity: Math.min(1, p * 2) }}>
      <Folder label={label} color={color} />
    </div>
  );
};

const HabitRow: React.FC<{ at: number; n: number; text: string; color: string }> = ({ at, n, text, color }) => {
  const p = usePop(at);
  return (
    <div style={{ transform: `translateX(${(1 - p) * -80}px) scale(${p})`, opacity: Math.min(1, p * 2), display: "flex", alignItems: "center", gap: 24 }}>
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          background: color,
          border: `6px solid ${C.ink}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT_BODY,
          fontWeight: 900,
          fontSize: 56,
          color: color === C.purple ? C.white : C.ink,
        }}
      >
        {n}
      </div>
      <Tag fontSize={58}>{text}</Tag>
    </div>
  );
};

// ===== 场景：从这里往下按配音时间排 =====
type Scene = { a: number; b: number; el: React.ReactNode };

const Shots: React.FC<{ shots: [number, number, Shot, string?][]; base: number }> = ({ shots, base }) => (
  <>
    {shots.map(([a, b, shot, label], i) => (
      <Sequence key={i} from={f(a - base)} durationInFrames={f(b) - f(a)}>
        {i === 0 ? (
          <CardIn>
            <Footage shot={shot} label={label} />
          </CardIn>
        ) : (
          <Footage shot={shot} label={label} />
        )}
      </Sequence>
    ))}
  </>
);

const SCENES: Scene[] = [
  // B 误解 vs 其实
  {
    a: 5.0,
    b: 13.1,
    el: (
      <>
        <Panel x={150} y={170} w={740} h={560} at={0} rotate={-2}>
          <Pill fontSize={40}>很多人以为</Pill>
          <StickerText text="办公 AI" fontSize={130} color={C.white} />
          <Body size={50}>Codex · WorkBuddy</Body>
        </Panel>
        <StrikeOut at={3.2} />
        <Panel x={1010} y={150} w={760} h={600} at={3.0} rotate={2}>
          <Pill fontSize={40} shadowColor={C.green}>
            其实它是
          </Pill>
          <StickerText text="【私人助理】" fontSize={130} />
          <Body size={50}>帮你打理生活</Body>
        </Panel>
      </>
    ),
  },
  // C 电脑可以关
  {
    a: 13.1,
    b: 25.25,
    el: (
      <>
        <Title at={0.2} text="最大的区别" y={60} size={110} />
        <Panel x={170} y={250} w={700} h={520} at={0.9} rotate={-1.5}>
          <Pill fontSize={38}>不少智能体</Pill>
          <Laptop on />
          <Body size={48}>电脑要一直开着</Body>
        </Panel>
        <Panel x={1050} y={250} w={700} h={520} at={4.6} rotate={1.5}>
          <Pill fontSize={38} shadowColor={C.green}>
            {PRODUCT}
          </Pill>
          <Cloud scale={0.9}>
            <Body size={40}>云端接着干</Body>
          </Cloud>
          <Body size={48}>电脑关了也没事</Body>
        </Panel>
        <Pop at={7.2} x={1180} y={760} rotate={-4}>
          <Tag fontSize={44} bg={C.yellow}>
            手机锁屏也行
          </Tag>
        </Pop>
      </>
    ),
  },
  // D 交代一句就行
  {
    a: 25.25,
    b: 30.0,
    el: (
      <>
        <Title at={0} text="你【交代一句】就行" y={140} size={110} />
        <Chips
          y={430}
          fontSize={66}
          items={[
            [0.15, "盯机票"],
            [0.95, "挑东西"],
            [1.75, "发邀请"],
            [2.55, "搭网站"],
          ]}
        />
        <Bot cx={960} bottom={890} scale={0.7} eyes="happy" />
      </>
    ),
  },
  // E 三部分
  {
    a: 30.0,
    b: 43.25,
    el: (
      <>
        <Title at={0.1} text="今天分【三部分】" y={100} size={120} />
        <Chips
          y={360}
          fontSize={66}
          items={[
            [1.6, "怎么用"],
            [3.1, "全部功能"],
            [5.2, "生活实操"],
          ]}
        />
        <Pop at={8.4} x={360} y={600} rotate={-3}>
          <Tag fontSize={56} bg={C.yellow}>
            学会这一套，同类 AI 一看就会
          </Tag>
        </Pop>
      </>
    ),
  },
  // F 怎么用
  {
    a: 43.25,
    b: 50.1,
    el: (
      <>
        <Title at={0} text="第一步：【怎么用】" y={110} size={110} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 420, display: "flex", justifyContent: "center", alignItems: "center", gap: 30 }}>
          <StepTag at={1.1} text={`打开 ${PRODUCT} 官网`} />
          <ArrowPop at={2.3} />
          <StepTag at={2.6} text="点右上角的登录入口" />
          <ArrowPop at={3.9} />
          <StepTag at={4.2} text="Meta 账号登录" />
        </div>
      </>
    ),
  },
  // G 改语言（录屏）
  {
    a: 50.1,
    b: 53.25,
    el: (
      <>
        <Shots base={50.1} shots={[[50.1, 53.25, s("c07", 24.5, 1, [[0, 380, 330, 1100], [3.1, 420, 420, 1000]], [], 1600, 1200), "设置 · 语言"]]} />
        <Callout from={0.5} to={3.15} x={1250} y={70} text="选中文（简体）" />
      </>
    ),
  },
  // H 在哪用
  {
    a: 53.25,
    b: 59.35,
    el: (
      <>
        <Title at={0} text="在哪用？" y={110} size={120} />
        <Chips
          y={380}
          fontSize={64}
          items={[
            [0.3, "手机版"],
            [1.1, "Mac 版"],
            [1.9, "网页版"],
          ]}
        />
        <Pop at={3.3} x={560} y={600} rotate={-3}>
          <Tag fontSize={56} bg={C.yellow}>
            网页版就够用，活都在云端
          </Tag>
        </Pop>
      </>
    ),
  },
  // I 额度（录屏）
  {
    a: 59.35,
    b: 66.0,
    el: (
      <>
        <Shots base={59.35} shots={[[59.35, 66.0, s("c07", 41.0, 1, [[0, 0, 0, 1600], [2.2, 380, 200, 1150], [6.6, 450, 330, 950]], [], 1600, 1200), "设置 · 用量"]]} />
        <Callout from={0.6} to={6.65} x={1240} y={70} text="免费版每周有额度" />
      </>
    ),
  },
  // J 地区提醒
  {
    a: 66.0,
    b: 72.05,
    el: (
      <>
        <Panel x={260} y={180} w={1400} h={540} at={0}>
          <Pill fontSize={44} shadowColor={C.pink}>
            提醒一句
          </Pill>
          <StickerText text="不是【所有地区】都能用" fontSize={110} />
          <Body size={52}>打不开，先别怀疑自己操作错了</Body>
        </Panel>
      </>
    ),
  },
  // K 下指令三件事
  {
    a: 72.05,
    b: 80.3,
    el: (
      <>
        <Title at={0} text="交代任务，说清【三件事】" y={100} size={104} />
        <Chips
          y={370}
          fontSize={62}
          items={[
            [2.4, "要做什么"],
            [3.7, "用哪些材料"],
            [5.0, "交付成什么样"],
          ]}
        />
        <Pop at={6.3} x={520} y={600} rotate={-3}>
          <Tag fontSize={56} bg={C.yellow}>
            说得越具体，它返工越少
          </Tag>
        </Pop>
      </>
    ),
  },
  // L 凭什么叫私人助理
  {
    a: 80.3,
    b: 86.3,
    el: (
      <>
        <Pop at={0} x={760} y={110}>
          <Pill fontSize={48} shadowColor={C.purple}>
            第二部分 · 全部功能
          </Pill>
        </Pop>
        <Title at={2.1} text="凭什么叫【私人助理】？" y={320} size={120} />
        <Bot cx={960} bottom={900} scale={0.62} eyes="ring" at={0.3} />
      </>
    ),
  },
  // M 动态
  {
    a: 86.3,
    b: 120.85,
    el: (
      <>
        <Shots
          base={86.3}
          shots={[
            [86.3, 96.0, s("c01", 9.0, 0.5, [[0, 0, 0, 2150], [3.5, 180, 0, 1750], [9.7, 300, 120, 1350]], []), "功能 1 · 动态"],
            [96.0, 105.0, s("c01", 13.85, 0.8, [[0, 180, 0, 1750], [9, 180, 60, 1650]], []), "功能 1 · 动态"],
            [105.0, 120.85, s("c01", 21.05, 0.15, [[0, 180, 60, 1650], [15.8, 330, 260, 1200]], []), "功能 1 · 动态"],
          ]}
        />
        <Callout from={0.4} to={4.0} x={1250} y={70} text="最容易被忽略" bg={C.pink} />
        <Callout from={18.8} to={24.6} x={1180} y={70} text="不是随机推，是猜你需要" />
        <Callout from={29.8} to={34.5} x={1250} y={70} text="但它不会主动提醒你" bg={C.pink} />
      </>
    ),
  },
  // N 对话 + O 新建旁聊
  {
    a: 120.85,
    b: 137.6,
    el: (
      <>
        <Shots
          base={120.85}
          shots={[
            [120.85, 129.8, s("c02", 4.2, 0.8, [[0, 0, 0, 2150], [2.5, 0, 0, 1500], [8.9, 0, 40, 1250]]), "功能 2 · 对话"],
            [129.8, 132.8, s("c08", 0.0, 1, [[0, 0, 0, 1500]]), "功能 2 · 对话"],
            [132.8, 137.6, s("c08", 11.0, 1, [[0, 0, 0, 1500], [1.5, 500, 683, 1650]]), "功能 2 · 对话"],
          ]}
        />
        <Callout from={2.7} to={8.9} x={1180} y={70} text="主对话：聊两句就走" />
        <Callout from={8.95} to={16.75} x={1100} y={70} text="侧对话：单独派任务" bg={C.green} />
      </>
    ),
  },
  // P 搜索
  {
    a: 137.6,
    b: 140.25,
    el: (
      <Shots
        base={137.6}
        shots={[[137.6, 140.25, s("c03", 8.0, 1, [[0, 250, 300, 1650]], [LIST, [600, 590, 960, 610]]), "功能 3 · 搜索"]]}
      />
    ),
  },
  // Q 点子
  {
    a: 140.25,
    b: 152.05,
    el: (
      <>
        <Shots
          base={140.25}
          shots={[
            [140.25, 144.0, s("c04", 3.0, 1, [[0, 180, 0, 1750]], [[360, 330, 1540, 640]]), "功能 4 · 点子"],
            [144.0, 152.05, s("c04", 15.4, 0.5, [[0, 180, 100, 1750], [8, 260, 330, 1400]], [[360, 130, 1540, 150]]), "功能 4 · 点子"],
          ]}
        />
        <Callout from={1.2} to={11.8} x={1120} y={70} text="它能直接上手帮你办的事" />
      </>
    ),
  },
  // R 目标
  {
    a: 152.05,
    b: 162.25,
    el: (
      <>
        <Shots
          base={152.05}
          shots={[[152.05, 162.25, s("c05", 2.5, 0.9, [[0, 180, 0, 1750], [2.6, 300, 120, 1300], [6.5, 300, 420, 1300], [10.2, 250, 330, 1450]], []), "功能 5 · 目标"]]}
        />
        <Callout from={2.5} to={7.4} x={1200} y={70} text="定期帮你复盘进度" />
        <Callout from={7.5} to={10.2} x={1150} y={70} text="办完了，直接关掉" bg={C.green} />
      </>
    ),
  },
  // S 资源库
  {
    a: 162.25,
    b: 168.75,
    el: (
      <>
        <Shots base={162.25} shots={[[162.25, 168.75, s("c06", 2.5, 1, [[0, 0, 0, 2150], [3, 0, 0, 1500], [6.5, 0, 40, 1450]], []), "功能 6 · 资源库"]]} />
        <Callout from={0.4} to={6.5} x={1120} y={70} text="文档 网页 图片 视频 声音" />
      </>
    ),
  },
  // T 生活场景
  {
    a: 168.75,
    b: 173.25,
    el: (
      <>
        <Pop at={0} x={760} y={110}>
          <Pill fontSize={48} shadowColor={C.green}>
            第三部分 · 生活实操
          </Pill>
        </Pop>
        <Title at={0.3} text="五个【生活场景】" y={260} size={120} />
        <Chips
          y={560}
          fontSize={56}
          gap={26}
          items={[
            [1.0, "盯机票"],
            [1.4, "挑东西"],
            [1.8, "发邀请"],
            [2.2, "搭网站"],
            [2.6, "收拾电脑"],
          ]}
        />
      </>
    ),
  },
  // U 盯机票
  {
    a: 173.25,
    b: 192.55,
    el: (
      <>
        <Shots
          base={173.25}
          shots={[
            [173.25, 182.8, s("c08", 11.0, 1, [[0, 500, 683, 1650], [6.8, 500, 683, 1650], [9.5, 450, 550, 1700]]), "场景 1 · 盯机票"],
            [182.8, 187.4, s("c11", 2.0, 1, [[0, 560, 150, 1580], [4.6, 620, 260, 1330]]), "场景 1 · 盯机票"],
            [187.4, 192.55, s("c11", 16.0, 1, [[0, 300, 250, 1500], [2.2, 470, 420, 1100]]), "场景 1 · 盯机票"],
          ]}
        />
        <Callout from={1.4} to={9.5} x={1180} y={70} text="每 6 小时报一次价" />
        <Callout from={9.6} to={14.1} x={1220} y={70} text="先报了一轮最低价" bg={C.green} />
        <Callout from={14.2} to={19.3} x={1180} y={70} text="已定时 · 每 6 小时" />
      </>
    ),
  },
  // V 挑镜头
  {
    a: 192.55,
    b: 215.0,
    el: (
      <>
        <Shots
          base={192.55}
          shots={[
            [192.55, 197.5, s("c09", 16.0, 1, [[0, 500, 683, 1650], [3.0, 500, 683, 1650], [4.9, 450, 550, 1700]]), "场景 2 · 挑东西"],
            [197.5, 202.7, s("c12", 58.0, 1, [[0, 800, 0, 1350]], []), "场景 2 · 挑东西"],
            [202.7, 215.0, s("c15", 8.0, 0.7, [[0, 850, 120, 1500], [5, 850, 120, 1500], [9, 900, 760, 1550]], [[200, 300, 600, 760]], 2880, 1634), "场景 2 · 挑东西"],
          ]}
        />
        <Callout from={5.0} to={10.1} x={1180} y={70} text="它自己开浏览器去比价" />
        <Callout from={10.2} to={16.8} x={1120} y={70} text="登录、付款要你自己来" bg={C.pink} />
        <Callout from={16.9} to={22.4} x={1120} y={70} text="省下挑选比价的时间" bg={C.green} />
      </>
    ),
  },
  // W 发邀请（示意）
  {
    a: 215.0,
    b: 229.85,
    el: (
      <>
        <Note text="示意图 · 本期未实测发送" />
        <Pop at={0} x={130} y={70}>
          <Pill fontSize={42} shadowColor={C.green}>
            场景 3 · 发邀请
          </Pill>
        </Pop>
        <Title at={0.4} text="生日聚会【邀请函】" y={180} size={110} />
        <Chips
          y={430}
          fontSize={58}
          items={[
            [1.6, "起草邀请函"],
            [3.6, "配上图片"],
            [4.9, "配一小段视频"],
          ]}
        />
        <BubbleAt at={8.3} x={420} y={640} rotate={-2} text="发之前，它会先跟你确认时间地点" />
        <Bot cx={1700} bottom={930} scale={0.62} eyes="happy" at={8} />
      </>
    ),
  },
  // X 搭网站
  {
    a: 229.85,
    b: 257.15,
    el: (
      <>
        <Shots
          base={229.85}
          shots={[
            [229.85, 239.75, s("c10", 3.5, 1, [[0, 500, 683, 1650], [4.5, 500, 683, 1650], [6.5, 450, 550, 1700], [9.9, 450, 550, 1700]]), "场景 4 · 搭网站"],
            [239.75, 245.75, s("c13", 1.0, 1, [[0, 450, 650, 1700]]), "场景 4 · 搭网站"],
            [245.75, 257.15, s("c14", 16.0, 1, [[0, 700, 0, 1450], [6, 700, 0, 1450], [11.4, 800, 80, 1350]], [], W, 1220), "场景 4 · 搭网站"],
          ]}
        />
        <Callout from={1.8} to={9.9} x={1150} y={70} text="来源 · 排序 · 版面说清楚" />
        <Callout from={9.95} to={15.9} x={1120} y={70} text="它派了助手去收集新闻" bg={C.green} />
        <Callout from={16.0} to={27.3} x={1220} y={70} text="默认只给自己看" bg={C.pink} />
      </>
    ),
  },
  // Y 收拾电脑（示意）
  {
    a: 257.15,
    b: 272.05,
    el: (
      <>
        <Note text="示意图 · 本期未实测" />
        <Pop at={0} x={130} y={70}>
          <Pill fontSize={42} shadowColor={C.green}>
            场景 5 · 收拾电脑
          </Pill>
        </Pop>
        <Title at={0.3} text="Mac 版：授权后连上你的电脑" y={170} size={86} />
        <Chips
          y={360}
          fontSize={54}
          items={[
            [2.4, "日历"],
            [3.1, "备忘录"],
            [3.8, "文件"],
          ]}
        />
        <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
          <FolderPop at={6.6} label="下载" color={C.white} />
          <ArrowPop at={7.4} />
          <FolderPop at={7.8} label="图片" color={C.yellow} />
          <FolderPop at={8.3} label="文档" color={C.green} />
          <FolderPop at={8.8} label="安装包" color={C.pink} />
        </div>
      </>
    ),
  },
  // Z1 批准卡
  {
    a: 272.05,
    b: 280.35,
    el: (
      <>
        <Title at={0} text="最后说说【安全】" y={110} size={116} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 420, display: "flex", justifyContent: "center", alignItems: "center", gap: 24 }}>
          <StepTag at={1.3} text="发邮件 · 下单 · 改文件" />
          <ArrowPop at={2.8} />
          <StepTag at={3.0} text="先弹批准卡" bg={C.yellow} />
          <ArrowPop at={4.6} />
          <StepTag at={4.8} text="你点允许，才执行" bg={C.green} />
        </div>
      </>
    ),
  },
  // Z2 三个习惯
  {
    a: 280.35,
    b: 298.55,
    el: (
      <>
        <Title at={0} text="三个【好习惯】" y={100} size={116} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>
          <HabitRow at={0.2} n={1} text="敏感操作，别点「始终允许」" color={C.green} />
          <HabitRow at={6.7} n={2} text="权限用到哪个，再开哪个" color={C.purple} />
          <HabitRow at={12.3} n={3} text="开了电脑使用，一定要盯着" color={C.yellow} />
        </div>
      </>
    ),
  },
  // AA 结论
  {
    a: 298.55,
    b: 310.05,
    el: (
      <>
        <Title at={0.1} text="【Codex】帮你把工作干完" y={110} size={104} />
        <Title at={3.0} text={`【${PRODUCT}】帮你把生活盯住`} y={260} size={104} />
        <Chips
          y={520}
          fontSize={58}
          items={[
            [6.6, "任务说清楚"],
            [7.6, "定时让它盯"],
            [8.8, "关键一步自己点头"],
          ]}
        />
      </>
    ),
  },
  // AB 结尾
  {
    a: 310.05,
    b: EP_END,
    el: (
      <>
        <Title at={0.1} text={`【${PRODUCT}】零基础教程 · 完`} y={100} size={104} />
        <Bot cx={960} bottom={900} scale={0.85} eyes="happy" />
        <BubbleAt at={4.55} x={1150} y={330} rotate={4} text="卡在哪一步？评论区告诉我" />
        <Pop at={11.9} x={300} y={420} rotate={-6}>
          <Tag fontSize={70} bg={C.yellow}>
            下期见！
          </Tag>
        </Pop>
      </>
    ),
  },
];

// ===== 整期 =====
export const ExampleEpisode: React.FC = () => {
  const openingEnd = OPENING_C_FRAMES;
  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      <Sequence from={openingEnd} durationInFrames={EP_FRAMES - openingEnd}>
        <PaperBackground />
        <Sparkles />
      </Sequence>
      {SCENES.map((sc, i) => (
        <Sequence key={i} from={f(sc.a)} durationInFrames={f(sc.b) - f(sc.a)}>
          {sc.el}
        </Sequence>
      ))}
      <Sequence durationInFrames={openingEnd}>
        <OpeningC {...episode} channelName={channel.channelName} />
      </Sequence>
      <Subtitles />
      <Audio src={staticFile("audio/voice.mp3")} />
    </AbsoluteFill>
  );
};
