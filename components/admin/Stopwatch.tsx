"use client";

import { useEffect, useState } from "react";
import { btn } from "@/lib/ui";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** 발표 경과 시간. 계획 시간을 넘기면 빨갛게 바뀐다. */
export default function Stopwatch({ plannedMin }: { plannedMin: number }) {
  const [startAt, setStartAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (startAt == null) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [startAt]);

  const sec = startAt == null ? 0 : Math.max(0, (now - startAt) / 1000);
  const over = sec > plannedMin * 60;

  return (
    <div>
      <div className="text-[13px] text-muted">경과 시간</div>
      <div className={"font-mono text-4xl font-semibold tabular-nums " + (over ? "text-fail" : "")}>{fmt(sec)}</div>
      <div className="mt-1 text-[13px] text-muted">계획 {fmt(plannedMin * 60)}</div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className={btn}
          onClick={() => {
            const t = Date.now();
            setStartAt(t);
            setNow(t);
          }}
        >
          {startAt == null ? "시작" : "다시 시작"}
        </button>
        {startAt != null && (
          <button type="button" className={btn} onClick={() => setStartAt(null)}>
            정지
          </button>
        )}
      </div>
    </div>
  );
}
