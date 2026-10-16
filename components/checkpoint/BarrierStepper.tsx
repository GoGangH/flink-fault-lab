"use client";

import { useState } from "react";
import { btn, btnPrime, card } from "@/lib/ui";
import { ALIGNED, HI, ITEMS, UNALIGNED } from "./barrierSteps";

export default function BarrierStepper() {
  const [mode, setMode] = useState<"al" | "un">("al");
  const [i, setI] = useState(0);
  const steps = mode === "al" ? ALIGNED : UNALIGNED;
  const s = steps[i];
  const last = i === steps.length - 1;
  const switchMode = (m: "al" | "un") => {
    setMode(m);
    setI((x) => Math.min(x, 1));
  };

  return (
    <div className="bs grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <div data-tour="bs-stage" className="overflow-x-auto rounded-lg border border-line bg-surface p-3">
        <svg className="block h-auto w-full min-w-[560px]" viewBox="0 0 800 300" role="img" aria-label="두 입력 채널과 연산자 사이에서 barrier 정렬 과정">
          <line x1="120" y1="70" x2="520" y2="70" className="bs-ch" />
          <line x1="120" y1="170" x2="520" y2="170" className="bs-ch" />
          <line x1="680" y1="120" x2="790" y2="120" className="bs-ch" />
          <g className="bs-src">
            <rect x="20" y="45" width="100" height="50" rx="8" />
            <text x="70" y="75" textAnchor="middle" className="bs-txt">Source 1</text>
          </g>
          <g className="bs-src">
            <rect x="20" y="145" width="100" height="50" rx="8" />
            <text x="70" y="175" textAnchor="middle" className="bs-txt">Source 2</text>
          </g>
          <text x="70" y="114" textAnchor="middle" className="bs-mute">{s.src[0]}</text>
          <text x="70" y="214" textAnchor="middle" className="bs-mute">{s.src[1]}</text>
          <rect x="520" y="30" width="160" height="180" rx="10" className={"bs-op " + s.cls} />
          <text x="600" y="58" textAnchor="middle" className="bs-txt" style={{ fontWeight: 600 }}>KeyedCount</text>
          <text x="600" y="112" textAnchor="middle" className="bs-txt">{s.op}</text>
          <text x="600" y="134" textAnchor="middle" className="bs-mute">{s.sub}</text>
          <text x="600" y="194" textAnchor="middle" className="bs-mute">{s.snap}</text>
          <text x="300" y="40" textAnchor="middle" className="bs-mute">채널 1</text>
          <text x="300" y="140" textAnchor="middle" className="bs-mute">채널 2</text>
          <text x="735" y="104" textAnchor="middle" className="bs-mute">다운스트림</text>
          <rect x="20" y="246" width="760" height="44" rx="8" className={"store-box" + (s.cls === "done" ? " done" : "")} />
          <text x="36" y="273" className="bs-txt" style={{ fontSize: 12.5 }}>
            <tspan style={{ fontWeight: 600 }}>저장소</tspan>  {s.store}
          </text>
          <g>
            {ITEMS.map(([id, kind, label, y]) => {
              const [px, py, op, cls] = s.pos[id] ?? HI(y);
              return (
                <g key={id} className={"it " + (cls ?? "")} style={{ transform: `translate(${px}px, ${py}px)`, opacity: op }}>
                  {kind === "r" ? (
                    <>
                      <circle className="r" r="13" />
                      <text className="r" x="0" y="4" textAnchor="middle">{label}</text>
                    </>
                  ) : (
                    <>
                      <circle className="b" r="13" stroke="var(--barrier)" strokeWidth="1.2" />
                      <text className="b" x="0" y="4" textAnchor="middle">{label}</text>
                    </>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <div data-tour="bs-side" className="flex flex-col gap-3.5">
        <div className={card + " flex-1"}>
          <div data-tour="bs-mode" className="flex flex-wrap items-center gap-2">
            <button className={btn} type="button" aria-pressed={mode === "al"} onClick={() => switchMode("al")}>Aligned</button>
            <button className={btn} type="button" aria-pressed={mode === "un"} onClick={() => switchMode("un")}>Unaligned</button>
            <div className="ml-auto flex gap-1.5">
              {steps.map((_, k) => (
                <i key={k} className={"h-1 w-4 rounded-sm " + (k <= i ? "bg-barrier" : "bg-line")} />
              ))}
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <span className="font-mono text-xs text-muted">{i + 1} / {steps.length}</span>
            <h3 className="mt-1.5 mb-2 text-lg font-semibold">{s.t}</h3>
            <p className="text-[15px] text-muted">{s.d}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className={btn} type="button" disabled={i === 0} onClick={() => setI(i - 1)}>이전</button>
          <button className={btnPrime} type="button" onClick={() => setI(last ? 0 : i + 1)}>
            {last ? "처음으로" : "다음 단계"}
          </button>
        </div>
      </div>
    </div>
  );
}
