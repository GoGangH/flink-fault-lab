"use client";

import { useState } from "react";
import { btn, btnKill, btnPrime, label } from "@/lib/ui";

type Rec = { id: number; v: string; st: "open" | "committed" | "aborted" };
const WORDS = ["A:1", "B:1", "A:2", "C:1", "B:2", "A:3"];

function Chip({ r }: { r: Rec }) {
  const c = {
    open: "border-dashed border-pending bg-pending-tint text-pending",
    committed: "border-transparent bg-ok-tint text-ink",
    aborted: "border-line text-muted line-through opacity-70",
  }[r.st];
  return <span className={"rounded-md border-[1.5px] px-2 py-1 font-mono text-xs " + c}>{r.v}</span>;
}

/** 프로듀서 트랜잭션과 consumer isolation.level에 따라 보이는 레코드가 달라지는 걸 보여준다 */
export default function TransactionDemo() {
  const [recs, setRecs] = useState<Rec[]>([]);
  const open = recs.filter((r) => r.st === "open").length;

  const write = () => setRecs((rs) => [...rs, { id: rs.length, v: WORDS[rs.length % WORDS.length], st: "open" }]);
  const end = (st: "committed" | "aborted") => setRecs((rs) => rs.map((r) => (r.st === "open" ? { ...r, st } : r)));

  const lanes: [string, string, (r: Rec) => boolean][] = [
    ["read_uncommitted", "커밋 전 데이터와 abort된 데이터까지 다 보임", () => true],
    ["read_committed", "커밋된 데이터만 보임", (r) => r.st === "committed"],
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-[18px] py-3">
        <span className={label}>producer</span>
        <button type="button" className={btnPrime} onClick={write}>트랜잭션에 쓰기</button>
        <button type="button" className={btn} onClick={() => end("committed")} disabled={!open}>commit</button>
        <button type="button" className={btnKill} onClick={() => end("aborted")} disabled={!open}>abort</button>
        <button type="button" className={btn} onClick={() => setRecs([])}>초기화</button>
        <span className="ml-auto font-mono text-xs text-muted">열린 트랜잭션 {open}건</span>
      </div>
      <div className="grid divide-y divide-line">
        {lanes.map(([name, desc, visible]) => {
          const shown = recs.filter(visible);
          return (
            <div key={name} className="grid gap-2 px-[18px] py-3 sm:grid-cols-[200px_1fr] sm:items-center">
              <div>
                <div className="font-mono text-[13px] font-semibold">consumer · {name}</div>
                <div className="text-xs text-muted">{desc}</div>
              </div>
              <div className="flex min-h-8 flex-wrap items-center gap-1.5">
                {shown.length ? shown.map((r) => <Chip key={r.id} r={r} />) : <span className="text-xs text-muted">보이는 레코드 없음</span>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="border-t border-line px-[18px] py-3 text-[14.5px] text-muted">
        abort된 레코드는 read_committed consumer에게 보이지 않습니다. Flink의 exactly-once Sink는 이 성질을 이용해 checkpoint가 끝날 때만 commit합니다.
      </p>
    </div>
  );
}
