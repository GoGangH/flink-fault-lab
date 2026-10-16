import { PAGES, PARTS, pageNo, type Part } from "@/lib/pages";

type Props = {
  /** 현재 페이지 id. 표시만 하고 동작은 바꾸지 않는다 */
  current?: string;
  /** 지정하면 링크 대신 버튼으로 그리고 클릭 시 호출 (목차 서랍용) */
  onSelect?: (id: string) => void;
  /** 빼고 싶은 묶음 */
  skip?: Part[];
  compact?: boolean;
};

/** 목차 페이지와 목차 서랍이 함께 쓰는 번호 목록 */
export default function PageList({ current, onSelect, skip = [], compact = false }: Props) {
  return (
    <div className={compact ? "grid gap-5" : "divide-y divide-line border-y border-line"}>
      {PARTS.filter((p) => !skip.includes(p)).map((part) => (
        <div key={part} className={compact ? "" : "grid gap-x-8 gap-y-2 py-5 md:grid-cols-[180px_1fr]"}>
          <div className={"text-[13px] font-semibold text-ink " + (compact ? "mb-1.5" : "pt-1.5")}>{part}</div>
          <ol className="grid">
            {PAGES.filter((p) => p.part === part).map((p) => {
              const on = p.id === current;
              const inner = (
                <>
                  <span className={"font-mono text-[13px] tabular-nums " + (on ? "text-rec" : "text-muted")}>{pageNo(p.id)}</span>
                  <span className={"font-semibold " + (compact ? "text-[14.5px]" : "text-base") + (on ? " text-rec" : "")}>{p.label}</span>
                  <span className={"text-muted " + (compact ? "col-start-2 text-[13px]" : "text-sm max-md:col-start-2")}>{p.desc}</span>
                </>
              );
              const cls =
                "grid w-full cursor-pointer items-baseline gap-x-3 rounded-lg px-2 py-2 text-left text-ink no-underline hover:bg-sunk " +
                (compact ? "grid-cols-[26px_1fr]" : "grid-cols-[30px_1fr] md:grid-cols-[30px_200px_1fr]") +
                (on ? " bg-sunk" : "");
              return (
                <li key={p.id}>
                  {onSelect ? (
                    <button type="button" className={cls} aria-current={on ? "page" : undefined} onClick={() => onSelect(p.id)}>
                      {inner}
                    </button>
                  ) : (
                    <a href={"#" + p.id} className={cls}>
                      {inner}
                    </a>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
