import { PAGES, pageNo } from "@/lib/pages";
import { SCRIPT } from "@/lib/script";
import ScriptBody from "./ScriptBody";

/** 각 페이지의 시작·끝 계획 시간(분) */
const ROWS = PAGES.reduce<{ id: string; from: number; to: number }[]>((rows, p) => {
  const from = rows.at(-1)?.to ?? 0;
  return [...rows, { id: p.id, from, to: from + (SCRIPT[p.id]?.min ?? 0) }];
}, []);

/** 대본 전체를 한 번에 읽는 보기 */
export default function FullScript() {
  return (
    <div className="mx-auto grid max-w-[760px] gap-10">
      {PAGES.map((p, i) => {
        const s = SCRIPT[p.id];
        if (!s) return null;
        const { from, to } = ROWS[i];
        return (
          <article key={p.id} className="border-t border-line pt-5">
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
              <span className="font-mono text-sm text-muted tabular-nums">{pageNo(p.id)}</span>
              <h2 className="text-xl font-bold">{p.label}</h2>
              <span className="text-sm text-muted">{p.part}</span>
              <span className="ml-auto font-mono text-sm text-muted tabular-nums">
                {fmtMin(from)}~{fmtMin(to)} · {s.min}분
              </span>
            </div>
            <ScriptBody script={s} />
          </article>
        );
      })}
    </div>
  );
}

const fmtMin = (m: number) => `${Math.floor(m)}:${String(Math.round((m % 1) * 60)).padStart(2, "0")}`;
