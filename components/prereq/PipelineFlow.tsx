"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

type Key = "A" | "B";
type Rec = { id: number; key: Key; x: number; count?: number };

const KEYS: Key[] = ["A", "B", "A", "A", "B", "B", "A", "B"];
const Y = 128;
/** 레코드가 지나가는 x 구간. 박스 안(처리 중)에서는 감춘다. */
const START = 150, END = 830;
const BOXES = [
  { x: 190, w: 140, title: "Source", sub: "Kafka에서 읽기" },
  { x: 420, w: 180, title: "KeyedCount", sub: "key별 개수 세기" },
  { x: 690, w: 120, title: "Sink", sub: "Kafka에 쓰기" },
] as const;
const COUNT_X = BOXES[1].x + BOXES[1].w / 2;
const SPEED = 150; // px/s
const EVERY = 1.1; // 초

const inside = (x: number) => BOXES.some((b) => x > b.x + 6 && x < b.x + b.w - 6);

type Model = { recs: Rec[]; counts: Record<Key, number>; out: string[]; seq: number; acc: number; offset: number };
const INITIAL: Model = { recs: [], counts: { A: 0, B: 0 }, out: [], seq: 0, acc: EVERY, offset: 0 };

/** dt초만큼 흐름을 진행한 새 상태 */
function advance(m: Model, dt: number): Model {
  let { seq, acc, offset, out } = m;
  const counts = { ...m.counts };
  let recs = m.recs.map((r) => ({ ...r }));
  acc += dt;
  if (acc >= EVERY) {
    acc = 0;
    recs.push({ id: seq, key: KEYS[seq % KEYS.length], x: START });
    seq++;
    offset++;
  }
  for (const r of recs) {
    const before = r.x;
    r.x += SPEED * dt;
    if (before < COUNT_X && r.x >= COUNT_X) r.count = ++counts[r.key];
    if (r.x >= END) out = [`${r.key}:${r.count}`, ...out].slice(0, 4);
  }
  recs = recs.filter((r) => r.x < END);
  return { recs, counts, out, seq, acc, offset };
}

/** 예제 Job의 데이터 흐름: orders → Source → keyBy → KeyedCount(state) → Sink → word-counts */
export default function PipelineFlow() {
  const [m, setM] = useState(INITIAL);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      // 이 페이지가 보일 때만 흐른다
      if (document.getElementById("job")?.classList.contains("cur")) setM((p) => advance(p, dt));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface p-3">
      <svg viewBox="0 0 960 240" className="stage block h-auto w-full min-w-[640px]" role="img" aria-label="orders 토픽에서 읽어 key별로 세고 word-counts 토픽에 쓰는 파이프라인">
        <text x="480" y="44" textAnchor="middle" className="t-small">한 벌만 그린 논리 흐름 · 시뮬레이터는 병렬도 2</text>

        {/* 입력 토픽 */}
        <rect x="10" y="78" width="130" height="100" rx="8" className="jm-box" />
        <text x="24" y="102" className="t-title" style={{ fontSize: 14 }}>orders</text>
        <text x="24" y="122" className="t-sub">Kafka 토픽</text>
        <text x="24" y="160" className="t-mono">offset {m.offset}</text>

        {/* 출력 토픽 */}
        <rect x="840" y="78" width="110" height="130" rx="8" className="jm-box" />
        <text x="852" y="102" className="t-title" style={{ fontSize: 14 }}>word-counts</text>
        <text x="852" y="122" className="t-sub">Kafka 토픽</text>
        {m.out.map((o, i) => (
          <text key={i} x="852" y={146 + i * 16} className="t-mono" style={{ fontSize: 12, opacity: 1 - i * 0.22 }}>
            {o}
          </text>
        ))}

        <line x1="140" y1={Y} x2="840" y2={Y} className="edge" />
        <text x={(BOXES[0].x + BOXES[0].w + BOXES[1].x) / 2} y={Y - 14} textAnchor="middle" className="t-small">keyBy(word)</text>

        {BOXES.map((b) => (
          <g key={b.title} className="node st-RUNNING">
            <rect x={b.x} y="72" width={b.w} height={b.title === "KeyedCount" ? 128 : 112} rx="9" />
            <text x={b.x + 14} y="96" className="t-title">{b.title}</text>
            <text x={b.x + 14} y="114" className="t-small">{b.sub}</text>
          </g>
        ))}
        {/* KeyedCount의 state */}
        <text x={BOXES[1].x + 14} y="150" className="t-bar">state</text>
        <text x={BOXES[1].x + 14} y="170" className="t-mono">A {m.counts.A} · B {m.counts.B}</text>

        {m.recs.map((r) =>
          inside(r.x) ? null : (
            <g key={r.id}>
              <circle cx={r.x} cy={Y} r="10" fill="var(--rec)" />
              <text x={r.x} y={Y + 3.5} textAnchor="middle" className="t-key">{r.key}</text>
              {r.count != null && (
                <text x={r.x} y={Y - 16} textAnchor="middle" className="t-small">
                  {r.key}:{r.count}
                </text>
              )}
            </g>
          ),
        )}
      </svg>
    </div>
  );
}
