"use client";

import { useState } from "react";
import { btn } from "@/lib/ui";
import { PATTERNS, STRATEGIES, simulate, type PatternId } from "./restartModel";

export default function RestartCompare() {
  const [pid, setPid] = useState<PatternId>("burst");
  const pat = PATTERNS[pid];
  const res = STRATEGIES.map((r) => ({ ...r, ...simulate(r.id, pat.gap, pat.n) }));
  const T = Math.max(...res.map((r) => r.end)) * 1.02;
  const W = 600;
  const X = (t: number) => 8 + (t / T) * (W - 16);

  return (
    <>
      <div data-tour="rc-pattern" className="mb-4 flex flex-wrap items-center gap-2">
        {(Object.keys(PATTERNS) as PatternId[]).map((k) => (
          <button key={k} type="button" className={btn} aria-pressed={pid === k} onClick={() => setPid(k)}>
            {PATTERNS[k].label}
          </button>
        ))}
        <span className="ml-1 text-[13px] text-muted">{pat.desc}</span>
      </div>
      <div data-tour="rc-rows" className="divide-y divide-line rounded-lg border border-line bg-surface px-[18px] py-1.5">
        {res.map((r) => (
          <div className="grid items-center gap-4 py-3.5 lg:grid-cols-[200px_1fr_150px]" key={r.id}>
            <div>
              <b className="block font-mono text-sm">{r.id}</b>
              <span className="font-mono text-xs text-muted">{r.cfg}</span>
            </div>
            <div className="min-w-0 overflow-x-auto">
              <svg className="block h-10 w-full min-w-[360px]" viewBox={`0 0 ${W} 40`} preserveAspectRatio="none" role="img" aria-label={`${r.id} 타임라인`}>
                {r.ev.map((e, k) => {
                  if (e.k === "run")
                    return <rect key={k} x={X(e.a)} y={18} width={Math.max(0, X(e.b) - X(e.a))} height={6} rx={3} fill="var(--ok)" />;
                  if (e.k === "wait") {
                    const w = Math.max(2, X(e.b) - X(e.a));
                    return (
                      <g key={k}>
                        <rect x={X(e.a)} y={14} width={w} height={14} rx={3} fill="var(--barrier)" />
                        <text x={X(e.a) + w / 2} y={10} textAnchor="middle" fontSize={10} fontFamily="var(--f-mono)" fill="var(--barrier)">
                          +{e.d}s
                        </text>
                      </g>
                    );
                  }
                  const x = X(e.a);
                  return (
                    <g key={k}>
                      <path d={`M${x - 5} 16 L${x + 5} 26 M${x + 5} 16 L${x - 5} 26`} stroke="var(--fail)" strokeWidth={2.5} />
                      {e.final && (
                        <text x={Math.min(x + 10, W - 60)} y={38} fontSize={10.5} fontWeight={600} fontFamily="var(--f-mono)" fill="var(--fail)">
                          FAILED
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
            {r.failed ? (
              <span className="text-[13.5px] font-semibold text-fail">
                {r.restarts === 0 ? "첫 장애에서 실패" : `${r.restarts}번 재시작 후 실패`}
                <small className="block text-xs font-normal text-muted">장애 {r.restarts + 1}번째에서 포기</small>
              </span>
            ) : (
              <span className="text-[13.5px] font-semibold text-ok">
                계속 실행
                <small className="block text-xs font-normal text-muted">재시작 {r.restarts}번, 대기 합계 {r.waited}초</small>
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-[12.5px] text-muted">
        <span><i className="mr-1.5 inline-block h-2 w-[18px] rounded-sm bg-ok align-[1px]" />RUNNING</span>
        <span><i className="mr-1.5 inline-block h-2 w-[18px] rounded-sm bg-barrier align-[1px]" />재시작 대기 (delay)</span>
        <span><i className="mr-1.5 inline-block h-2 w-[18px] rounded-sm bg-fail align-[1px]" />장애 · Job FAILED</span>
      </div>
      <p data-tour="rc-takeaway" className="mt-4 max-w-[75ch] border-l-[3px] border-rec pl-4 text-[15px]">{pat.takeaway}</p>
    </>
  );
}
