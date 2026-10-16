"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * checkpoint 하나에 무엇이 들어가는지 (병렬도 1로 단순화).
 * 레코드가 흐르는 중에 Source 안에서 barrier가 생겨 레코드 사이에 끼어 흐른다.
 * barrier가 각 Task를 지나는 순간 그 Task의 state가 조각이 되어 저장소 칸으로 내려가고(미확정),
 * 세 조각이 다 모이면 _metadata가 기록되며 checkpoint가 확정된다.
 */

type Key = "A" | "B";
type Rec = { id: number; key: Key; x: number };
type Piece = { task: number; label: string; p: number };

const Y = 70;
const SPEED = 110; // px/s, 레코드와 barrier가 같은 속도
const EVERY = 0.85; // 레코드 간격(초)
const KEYS: Key[] = ["A", "B", "A", "A", "B", "B", "A", "B"];
const TASKS = [
  { cx: 150, title: "Source", what: "어디까지 읽었나" },
  { cx: 450, title: "KeyedCount", what: "key별로 센 값" },
  { cx: 750, title: "Sink", what: "준비된 트랜잭션" },
];
const BOX_W = 180, BOX_H = 70;
const INJECT_AT = 2.2; // 사이클 시작 후 barrier가 생기는 시점(초)
const HOLD = 2.6; // 확정 후 보여 주는 시간(초)
const DROP = 0.7; // 조각이 저장소로 내려가는 시간(초)
const SLOT_Y = 210;

type Model = {
  t: number;
  seq: number;
  acc: number;
  recs: Rec[];
  read: number; // Source가 읽은 개수 = 다음 offset
  counts: Record<Key, number>;
  chk: number;
  barrierX: number | null;
  passed: boolean[];
  pieces: Piece[];
  landed: boolean[];
  doneAt: number | null;
};

const fresh = (chk: number, base?: Model): Model => ({
  t: 0,
  seq: base?.seq ?? 0,
  acc: base?.acc ?? 0,
  recs: base?.recs ?? [],
  read: base?.read ?? 40,
  counts: base?.counts ?? { A: 22, B: 18 },
  chk,
  barrierX: null,
  passed: [false, false, false],
  pieces: [],
  landed: [false, false, false],
  doneAt: null,
});

/** dt초만큼 진행한 새 상태 */
function advance(m0: Model, dt: number): Model {
  const m: Model = { ...m0, recs: m0.recs.map((r) => ({ ...r })), counts: { ...m0.counts }, passed: [...m0.passed], landed: [...m0.landed], pieces: m0.pieces.map((p) => ({ ...p })) };
  m.t += dt;

  // 레코드는 왼쪽(Kafka)에서 계속 들어온다
  m.acc += dt;
  if (m.acc >= EVERY) {
    m.acc = 0;
    m.recs.push({ id: m.seq, key: KEYS[m.seq % KEYS.length], x: 0 });
    m.seq++;
  }
  for (const r of m.recs) {
    const before = r.x;
    r.x += SPEED * dt;
    if (before < TASKS[0].cx && r.x >= TASKS[0].cx) m.read++;
    if (before < TASKS[1].cx && r.x >= TASKS[1].cx) m.counts[r.key]++;
  }
  m.recs = m.recs.filter((r) => r.x < 900);

  // barrier: Source 가운데에서 생겨, 레코드와 같은 속도로 흐른다
  if (m.barrierX == null && !m.passed[0] && m.t >= INJECT_AT) m.barrierX = TASKS[0].cx;
  else if (m.barrierX != null) {
    m.barrierX += SPEED * dt;
    if (m.barrierX > 900) m.barrierX = null;
  }
  TASKS.forEach((task, i) => {
    const reached = i === 0 ? m.t >= INJECT_AT : m.barrierX != null && m.barrierX >= task.cx;
    if (!m.passed[i] && reached) {
      m.passed[i] = true;
      const label = i === 0 ? `offset ${m.read}` : i === 1 ? `A ${m.counts.A} · B ${m.counts.B}` : `txn ${m.chk} 준비됨`;
      m.pieces.push({ task: i, label, p: 0 });
    }
  });
  for (const p of m.pieces) {
    if (p.p < 1) {
      p.p = Math.min(1, p.p + dt / DROP);
      if (p.p >= 1) m.landed[p.task] = true;
    }
  }
  if (m.doneAt == null && m.landed.every(Boolean)) m.doneAt = m.t;
  if (m.doneAt != null && m.t - m.doneAt > HOLD) return fresh(m.chk + 1, m);
  return m;
}

/** 움직임 줄이기: 확정된 장면 하나 */
function staticFrame(): Model {
  const m = fresh(8);
  m.passed = [true, true, true];
  m.landed = [true, true, true];
  m.pieces = [
    { task: 0, label: "offset 42", p: 1 },
    { task: 1, label: "A 23 · B 19", p: 1 },
    { task: 2, label: "txn 8 준비됨", p: 1 },
  ];
  m.doneAt = 0;
  m.recs = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => ({ id: k, key: KEYS[k], x: 40 + k * 110 }));
  return m;
}

const inBox = (x: number) => TASKS.some((t) => Math.abs(x - t.cx) < BOX_W / 2 - 4);

export default function CheckpointAnatomy() {
  const reduced = useReducedMotion();
  const [m, setM] = useState(() => fresh(8));

  useEffect(() => {
    if (reduced) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (document.getElementById("checkpoint")?.classList.contains("cur")) setM((p) => advance(p, dt));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const v = reduced ? staticFrame() : m;
  const done = v.doneAt != null;
  const waiting = v.landed.filter(Boolean).length;

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface p-3">
      <svg viewBox="0 0 900 330" className="stage block h-auto w-full min-w-[620px]" role="img" aria-label="레코드 사이에 낀 barrier가 Source, KeyedCount, Sink를 차례로 지날 때마다 각 Task의 state가 저장소로 올라가고, 다 모이면 _metadata로 확정되는 과정">
        <line x1="0" y1={Y} x2="900" y2={Y} className="edge" />
        <text x="6" y={Y - 14} className="t-small">Kafka</text>

        {TASKS.map((t, i) => (
          <g key={t.title} className={"node st-RUNNING" + (v.pieces.some((p) => p.task === i && p.p < 0.35) ? " flash" : "")}>
            <rect x={t.cx - BOX_W / 2} y={Y - BOX_H / 2} width={BOX_W} height={BOX_H} rx="9" />
            <text x={t.cx} y={Y - 6} textAnchor="middle" className="t-title">{t.title}</text>
            <text x={t.cx} y={Y + 16} textAnchor="middle" className="t-small">{t.what}</text>
          </g>
        ))}

        {/* 레코드 (박스 안에서는 처리 중이라 감춤) */}
        {v.recs.map((r) =>
          inBox(r.x) ? null : (
            <g key={r.id}>
              <circle cx={r.x} cy={Y} r="10" fill="var(--rec)" />
              <text x={r.x} y={Y + 3.5} textAnchor="middle" className="t-key">{r.key}</text>
            </g>
          ),
        )}
        {/* barrier: 레코드 사이에 끼어 같은 속도로 흐른다 */}
        {v.barrierX != null && !inBox(v.barrierX) && (
          <g>
            <circle cx={v.barrierX} cy={Y} r="11" fill="var(--barrier-dot)" stroke="var(--barrier)" strokeWidth="1.2" />
            <text x={v.barrierX} y={Y + 4} textAnchor="middle" className="t-bkey" style={{ fontSize: 11 }}>{v.chk}</text>
          </g>
        )}
        {v.passed[0] && !v.passed[1] && v.t - INJECT_AT < 1.4 && (
          <text x={TASKS[0].cx} y={Y - BOX_H / 2 - 8} textAnchor="middle" className="t-bar">barrier {v.chk} 생성 → 레코드 사이로</text>
        )}

        {/* 저장소 */}
        <rect x="20" y="148" width="860" height="172" rx="10" className={"store-box" + (done ? " done" : "")} />
        <text x="36" y="172" className="t-title" style={{ fontSize: 14 }}>
          Checkpoint 저장소 · chk-{v.chk}
        </text>
        <text x="864" y="172" textAnchor="end" className="t-mono" style={{ fontSize: 12 }}>
          {done ? "확정" : waiting ? `미확정 · ${waiting}/3` : "시작 전"}
        </text>
        {TASKS.map((t, i) => (
          <g key={t.title}>
            <rect x={t.cx - 120} y={SLOT_Y - 24} width="240" height="48" rx="7" className={"slot-box" + (v.landed[i] && !done ? " fresh" : "")} />
            {!v.landed[i] && <text x={t.cx} y={SLOT_Y + 4} textAnchor="middle" className="t-small">{t.title} 파일 자리</text>}
          </g>
        ))}
        <rect x="40" y="252" width="820" height="52" rx="7" className={"slot-box" + (done ? " meta" : "")} />
        <text x="56" y="274" className="t-small">_metadata · JobManager가 마지막에 쓰는 파일</text>
        <text x="56" y="294" className="t-mono" style={{ fontSize: 12 }}>
          {done ? `chk-${v.chk} 기록됨 → 이 순간 확정` : `아직 없음 → chk-${v.chk}는 아직 무효 (${waiting}/3)`}
        </text>

        {/* state 조각: Task에서 떨어져 나와 자기 칸으로 내려간다 */}
        {v.pieces.map((p) => {
          const t = TASKS[p.task];
          const y0 = Y + BOX_H / 2 + 4, y = y0 + (SLOT_Y - y0) * p.p;
          return (
            <g key={p.task}>
              <rect x={t.cx - 100} y={y - 16} width="200" height="32" rx="6" fill="var(--barrier-tint)" stroke="var(--barrier)" />
              <text x={t.cx} y={y + 5} textAnchor="middle" className="t-mono" style={{ fontSize: 13 }}>{p.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
