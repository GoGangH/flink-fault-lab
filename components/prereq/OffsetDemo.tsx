"use client";

import { useState } from "react";
import { btn, btnPrime, label } from "@/lib/ui";

const LOG = "ABACBCAABCBA".split("");

/** 파티션 로그와 consumer 위치. offset을 저장해 두면 장애 뒤 그 지점으로 되감아 다시 읽을 수 있다 */
export default function OffsetDemo() {
  const [pos, setPos] = useState(0);
  const [saved, setSaved] = useState<number | null>(null);
  const [reads, setReads] = useState<number[]>(() => LOG.map(() => 0));
  const [msg, setMsg] = useState("consumer는 다음에 읽을 위치를 offset 하나로 기억합니다.");

  const read = () => {
    if (pos >= LOG.length) return;
    setReads((r) => r.map((n, i) => (i === pos ? n + 1 : n)));
    setMsg(`offset ${pos}의 ${LOG[pos]}를 읽었습니다.${reads[pos] > 0 ? " 이미 한 번 읽은 레코드라 다시 처리하는 중입니다." : ""}`);
    setPos(pos + 1);
  };
  const save = () => {
    setSaved(pos);
    setMsg(`다음에 읽을 위치 offset ${pos}를 저장했습니다. Flink는 이 값을 연산자 state와 함께 checkpoint에 넣어 둡니다.`);
  };
  const seek = () => {
    if (saved == null) return;
    setMsg(`장애가 났다고 치고 offset ${saved}로 되감았습니다(seek). ${pos - saved}개를 다시 읽게 됩니다. 이것이 '되감을 수 있는 Source'입니다.`);
    setPos(saved);
  };
  const reset = () => {
    setPos(0);
    setSaved(null);
    setReads(LOG.map(() => 0));
    setMsg("consumer는 다음에 읽을 위치를 offset 하나로 기억합니다.");
  };

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-[18px] py-3">
        <span className={label}>consumer</span>
        <button type="button" className={btnPrime} onClick={read} disabled={pos >= LOG.length}>읽기 (poll)</button>
        <button type="button" className={btn} onClick={save}>offset 저장</button>
        <button type="button" className={btn} onClick={seek} disabled={saved == null}>장애 → 되감기 (seek)</button>
        <button type="button" className={btn} onClick={reset}>초기화</button>
      </div>
      <div className="overflow-x-auto px-[18px] pt-5 pb-3">
        <div className="mb-1.5 font-mono text-xs text-muted">topic orders · partition 0</div>
        <div className="flex min-w-max gap-1">
          {LOG.map((k, i) => (
            <div key={i} className="relative flex flex-col items-center">
              <div
                className={
                  "grid h-11 w-10 place-items-center rounded-md border-[1.5px] font-mono text-sm font-semibold transition-colors " +
                  (reads[i] > 1 ? "border-barrier bg-barrier-tint text-ink" : reads[i] === 1 ? "border-transparent bg-sunk text-ink" : "border-line text-muted")
                }
              >
                {k}
              </div>
              <span className="mt-1 font-mono text-[11px] text-muted tabular-nums">{i}</span>
              {saved === i && <span className="absolute -top-1 -left-[3px] h-[52px] w-[3px] rounded bg-barrier" title="저장된 offset" />}
              {pos === i && <span className="mt-0.5 font-mono text-[11px] font-semibold text-rec">▲ 위치</span>}
            </div>
          ))}
          {pos === LOG.length && <span className="self-center pl-2 font-mono text-[11px] text-rec">끝</span>}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-[18px] pb-3 text-xs text-muted">
        <span><i className="mr-1.5 inline-block size-3 rounded-[3px] bg-sunk align-[-2px]" />읽음</span>
        <span><i className="mr-1.5 inline-block size-3 rounded-[3px] border-[1.5px] border-barrier bg-barrier-tint align-[-2px]" />다시 읽음</span>
        <span><i className="mr-1.5 inline-block h-3 w-[3px] rounded bg-barrier align-[-2px]" />저장된 offset</span>
      </div>
      <p className="border-t border-line px-[18px] py-3 text-[14.5px] text-muted">{msg}</p>
    </div>
  );
}
