"use client";

import { useState } from "react";
import { btn, btnKill, label } from "@/lib/ui";

type Key = "A" | "B" | "C";
type TaskNo = 1 | 2;

/** keyBy: key를 해시해서 병렬 Task 중 하나로 보낸다. 데모에서는 A·C → Task 1, B → Task 2 */
const ROUTE: Record<Key, TaskNo> = { A: 1, B: 2, C: 1 };
const HASH: Record<Key, number> = { A: 0, B: 1, C: 2 };

type TaskState = { counts: Partial<Record<Key, number>>; dead: boolean; lost: boolean };
const empty = (): Record<TaskNo, TaskState> => ({
  1: { counts: {}, dead: false, lost: false },
  2: { counts: {}, dead: false, lost: false },
});

/** 레코드가 key별로 같은 Task에 모여 state가 되고, Task가 죽으면 그 state가 사라지는 걸 보여준다 */
export default function KeyedStateDemo() {
  const [tasks, setTasks] = useState(empty);
  const [last, setLast] = useState<{ key: Key; to: TaskNo; blocked: boolean } | null>(null);

  const send = (key: Key) => {
    const to = ROUTE[key];
    if (tasks[to].dead) {
      setLast({ key, to, blocked: true });
      return;
    }
    setTasks((t) => {
      const counts = { ...t[to].counts, [key]: (t[to].counts[key] ?? 0) + 1 };
      return { ...t, [to]: { ...t[to], counts } };
    });
    setLast({ key, to, blocked: false });
  };
  const kill = () => setTasks((t) => ({ ...t, 1: { counts: {}, dead: true, lost: true } }));
  const revive = () => setTasks((t) => ({ ...t, 1: { ...t[1], dead: false } }));

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-[18px] py-3">
        <span className={label}>레코드 보내기</span>
        {(["A", "B", "C"] as Key[]).map((k) => (
          <button key={k} type="button" className={btn} onClick={() => send(k)}>
            {k} 보내기
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-line" />
        {tasks[1].dead ? (
          <button type="button" className={btn} onClick={revive}>Task 1 다시 띄우기</button>
        ) : (
          <button type="button" className={btnKill} onClick={kill}>Task 1 장애</button>
        )}
        <button type="button" className={btn} onClick={() => { setTasks(empty()); setLast(null); }}>
          초기화
        </button>
      </div>

      <div className="grid items-center gap-4 p-[18px] md:grid-cols-[150px_120px_1fr]">
        <div className="rounded-lg border-[1.5px] border-ink p-3 text-center">
          <div className="text-[15px] font-semibold">Source</div>
          <div className="font-mono text-xs text-muted">단어를 읽음</div>
        </div>
        <div className="text-center font-mono text-xs text-muted">
          keyBy(word)
          <div className="mt-1 text-[11px]">hash(key) % 2</div>
          <div className="mt-1 text-lg max-md:rotate-90">→</div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {([1, 2] as TaskNo[]).map((n) => {
            const t = tasks[n];
            const hit = last && last.to === n;
            const keys = (Object.keys(ROUTE) as Key[]).filter((k) => ROUTE[k] === n);
            return (
              <div
                key={n}
                className={
                  "rounded-lg border-[1.5px] p-3 transition-colors duration-300 " +
                  (t.dead ? "border-fail bg-fail-tint" : hit ? "border-rec bg-sunk" : "border-ink")
                }
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[15px] font-semibold">Count · Task {n}</span>
                  <span className={"font-mono text-[11px] " + (t.dead ? "font-semibold text-fail" : "text-muted")}>
                    {t.dead ? "FAILED" : `key ${keys.join(", ")}`}
                  </span>
                </div>
                <div className="mt-2 font-mono text-[11px] text-muted">keyed state</div>
                <table className="mt-1 w-full font-mono text-[13px] tabular-nums">
                  <tbody>
                    {keys.map((k) => (
                      <tr key={k} className="border-t border-line">
                        <td className="py-1">{k}</td>
                        <td className={"py-1 text-right " + (t.lost && !t.counts[k] ? "text-fail" : "")}>
                          {t.counts[k] ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className={
          "border-t border-line px-[18px] py-3 text-[14.5px] " +
          (tasks[1].lost ? "bg-fail-tint text-fail" : "text-muted")
        }
      >
        {tasks[1].lost
          ? "Task 1이 죽으면서 메모리에 있던 A, C의 개수가 사라졌습니다. 다시 띄워도 0부터 셉니다. 이 state를 어딘가에 저장해 두는 장치가 checkpoint입니다."
          : last
            ? last.blocked
              ? `${last.key}는 Task ${last.to}로 가야 하는데 Task ${last.to}가 죽어 있습니다.`
              : `${last.key} → hash(${last.key}) % 2 = ${HASH[last.key] % 2} → Task ${last.to}. 같은 key는 항상 같은 Task로 가서, 그 Task가 key별 개수를 들고 있습니다.`
            : "같은 key는 항상 같은 Task로 가고, 그 Task가 key별 개수를 들고 있습니다."}
      </div>
    </div>
  );
}
