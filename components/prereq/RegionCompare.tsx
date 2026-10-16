"use client";

import { useState } from "react";
import { btn, btnKill } from "@/lib/ui";

type Kind = "keyby" | "forward";

/** 한 Job 그림의 좌표 (viewBox 500×330). 왼쪽 열 tm-1, 오른쪽 열 tm-2 */
const COL = [145, 355];
const ROW = { src: 40, mid: 140, sink: 240 };
const BW = 150, BH = 50;
const TITLES: Record<Kind, [string, string]> = { keyby: ["Source", "Count"], forward: ["Source", "Map"] };

/** 이 Job에서 데이터가 흐르는 선 (레코드가 따라 움직인다) */
function edges(kind: Kind): { from: [number, number]; to: [number, number]; lane: number[] }[] {
  const out: { from: [number, number]; to: [number, number]; lane: number[] }[] = [];
  const srcBottom = ROW.src + BH, midTop = ROW.mid, midBottom = ROW.mid + BH, sinkTop = ROW.sink;
  for (const i of [0, 1]) {
    if (kind === "keyby") {
      for (const j of [0, 1]) out.push({ from: [COL[i] + (j === 0 ? -20 : 20), srcBottom], to: [COL[j] + (i === 0 ? -20 : 20), midTop], lane: [i, j] });
    } else {
      out.push({ from: [COL[i], srcBottom], to: [COL[i], midTop], lane: [i] });
    }
    out.push({ from: [COL[i], midBottom], to: [COL[i], sinkTop], lane: [i] });
  }
  return out;
}

function Job({ kind, killed }: { kind: Kind; killed: boolean }) {
  // keyBy: 모든 subtask가 이어져 region 1개 → 하나만 죽어도 전부 재시작
  // forward: 줄마다 따로 region → 죽은 줄(tm-1)만 재시작
  const restarts = (lane: number) => killed && (kind === "keyby" || lane === 0);
  const [srcT, midT] = TITLES[kind];
  const rows: [string, number][] = [[srcT, ROW.src], [midT, ROW.mid], ["Sink", ROW.sink]];

  return (
    <svg viewBox="0 0 500 330" className="stage block h-auto w-full min-w-[360px]" role="img" aria-label={kind === "keyby" ? "keyBy가 있는 Job: 모든 subtask가 연결된 region 1개" : "forward만 있는 Job: 줄마다 region이 따로"}>
      {/* TaskManager 열 */}
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x={COL[i] - 95} y="8" width="190" height="300" rx="10" className={"tm-box" + (killed && i === 0 ? " tm-dead" : "")} style={{ cursor: "default" }} />
          <text x={COL[i]} y="324" textAnchor="middle" className="t-tm">{`tm-${i + 1}${killed && i === 0 ? " (죽음)" : ""}`}</text>
        </g>
      ))}

      {/* region 표시 */}
      {kind === "keyby" ? (
        <rect x="58" y="26" width="384" height="276" rx="12" className={"region-box" + (killed ? " hit" : "")} />
      ) : (
        [0, 1].map((i) => <rect key={i} x={COL[i] - 86} y="26" width="172" height="276" rx="12" className={"region-box" + (restarts(i) ? " hit" : "")} />)
      )}

      {edges(kind).map((e, k) => (
        <line key={k} x1={e.from[0]} y1={e.from[1]} x2={e.to[0]} y2={e.to[1]} className="chan" />
      ))}

      {[0, 1].flatMap((i) =>
        rows.map(([t, y]) => {
          const state = killed && i === 0 ? "FAILED" : restarts(i) ? "재시작" : "실행 중";
          const cls = state === "FAILED" ? "st-FAILED" : state === "재시작" ? "st-DEPLOYING" : "st-RUNNING";
          return (
            <g key={t + i} className={"node " + cls}>
              <rect x={COL[i] - BW / 2} y={y} width={BW} height={BH} rx="8" />
              <text x={COL[i]} y={y + 22} textAnchor="middle" className="t-title" style={{ fontSize: 14 }}>{`${t}[${i}]`}</text>
              <text x={COL[i]} y={y + 40} textAnchor="middle" className="t-st">{state}</text>
            </g>
          );
        }),
      )}

      {/* 흐르는 레코드: 재시작 중인 줄은 멈춘다 */}
      {edges(kind).map((e, k) =>
        e.lane.some((l) => restarts(l)) ? null : (
          <circle key={`r${k}`} r="6" fill="var(--rec)">
            <animateMotion dur={`${1.6 + (k % 3) * 0.3}s`} repeatCount="indefinite" path={`M${e.from[0]} ${e.from[1]} L${e.to[0]} ${e.to[1]}`} />
          </circle>
        ),
      )}
    </svg>
  );
}

/** keyBy가 있는 Job과 forward만 있는 Job에서 tm-1이 죽으면 어디까지 재시작되는지 비교 */
export default function RegionCompare() {
  const [killed, setKilled] = useState(false);
  const panes: [Kind, string, string, string][] = [
    ["keyby", "keyBy가 있는 Job", "region 1개", "모든 Source가 모든 Count로 보낼 수 있어 6개가 하나로 이어집니다. tm-1만 죽어도 tm-2의 Task까지 6개 모두 재시작합니다."],
    ["forward", "forward만 있는 Job", "region 2개", "줄끼리 데이터를 주고받지 않아 줄마다 region이 따로입니다. tm-1의 줄만 재시작하고, tm-2의 줄은 계속 처리합니다."],
  ];
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        {killed ? (
          <button type="button" className={btn} onClick={() => setKilled(false)}>되돌리기</button>
        ) : (
          <button type="button" className={btnKill} onClick={() => setKilled(true)}>tm-1 종료</button>
        )}
        <span className="text-[13px] text-muted">
          {killed ? "빨강은 죽은 Task, 보라는 재시작하는 Task, 흰색은 그대로 실행하는 Task입니다." : "같은 장애를 두 Job에 똑같이 내 봅니다."}
        </span>
      </div>
      <div className="grid divide-line max-lg:divide-y lg:grid-cols-2 lg:divide-x">
        {panes.map(([kind, title, regions, desc]) => (
          <div key={kind} className="min-w-0 p-4">
            <div className="mb-2 flex flex-wrap items-baseline gap-x-3">
              <h4 className="text-base font-semibold">{title}</h4>
              <span className="text-[13px] text-muted">{regions}</span>
            </div>
            <div className="overflow-x-auto">
              <Job kind={kind} killed={killed} />
            </div>
            <p className={"mt-2 text-sm " + (killed ? "text-ink" : "text-muted")}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
