"use client";

import { useEffect, useRef, useState } from "react";
import { PAGES, pageNo } from "@/lib/pages";
import { SCRIPT } from "@/lib/script";
import { openDeckChannel } from "@/lib/deckChannel";
import { btn, btnPrime } from "@/lib/ui";
import ScriptBody from "./ScriptBody";
import FullScript from "./FullScript";
import Stopwatch from "./Stopwatch";

const TOTAL_MIN = PAGES.reduce((s, p) => s + (SCRIPT[p.id]?.min ?? 0), 0);

/**
 * 발표자 화면. 같은 브라우저에서 발표 창(/)을 열어 두면 현재 페이지 대본이 따라오고,
 * 여기서 이전/다음을 누르면 발표 창도 넘어간다.
 */
export default function PresenterView() {
  const [mode, setMode] = useState<"live" | "all">("live");
  const [cur, setCur] = useState(0);
  const [linked, setLinked] = useState(false);
  const channel = useRef<ReturnType<typeof openDeckChannel> | null>(null);

  useEffect(() => {
    const ch = openDeckChannel((m) => {
      if (m.type !== "page") return;
      const i = PAGES.findIndex((p) => p.id === m.id);
      if (i >= 0) {
        setCur(i);
        setLinked(true);
      }
    });
    channel.current = ch;
    ch.post({ type: "hello" });
    return () => ch.close();
  }, []);

  const go = (i: number) => {
    const n = Math.max(0, Math.min(PAGES.length - 1, i));
    setCur(n);
    channel.current?.post({ type: "go", id: PAGES[n].id });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mode !== "live" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(cur + 1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(cur - 1); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const page = PAGES[cur];
  const next = PAGES[cur + 1];
  const script = SCRIPT[page.id];
  const elapsedPlan = PAGES.slice(0, cur).reduce((s, p) => s + (SCRIPT[p.id]?.min ?? 0), 0);

  return (
    <div className="mx-auto max-w-[1200px] pt-5 pb-16">
      <header className="mb-6 flex flex-wrap items-center gap-3 border-b border-line pb-4">
        <h1 className="mr-auto text-lg font-bold">발표자 대본</h1>
        <div className="flex gap-1.5">
          <button type="button" className={btn} aria-pressed={mode === "live"} onClick={() => setMode("live")}>
            발표자 모드
          </button>
          <button type="button" className={btn} aria-pressed={mode === "all"} onClick={() => setMode("all")}>
            전체 대본
          </button>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className={btn + " no-underline"}>
          발표 창 열기
        </a>
      </header>

      {mode === "all" ? (
        <FullScript />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <main className="min-w-0">
            <div className="mb-1 flex flex-wrap items-baseline gap-x-3 text-sm text-muted">
              <span className="font-mono tabular-nums">
                {pageNo(page.id)} / {PAGES.length}
              </span>
              <span>{page.part}</span>
              <span>{script?.min}분</span>
            </div>
            <h2 className="mb-6 text-[clamp(26px,3vw,34px)] font-bold">{page.label}</h2>
            {script ? <ScriptBody script={script} large /> : <p className="text-muted">이 페이지는 대본이 없습니다.</p>}
            <div className="mt-8 flex gap-2">
              <button type="button" className={btn} onClick={() => go(cur - 1)} disabled={cur === 0}>
                이전
              </button>
              <button type="button" className={btnPrime} onClick={() => go(cur + 1)} disabled={!next}>
                다음
              </button>
            </div>
          </main>

          <aside className="grid content-start gap-6 lg:border-l lg:border-line lg:pl-6">
            <Stopwatch plannedMin={TOTAL_MIN} />
            <div className="text-[13px] text-muted">
              이 페이지까지 계획 시간 {Math.round((elapsedPlan + (script?.min ?? 0)) * 10) / 10}분
            </div>
            <div className={"rounded-md px-3 py-2 text-[13px] " + (linked ? "bg-ok-tint text-ok" : "bg-sunk text-muted")}>
              {linked ? "발표 창과 연결됨. 넘기면 대본이 따라옵니다." : "같은 브라우저에서 발표 창을 열면 페이지가 자동으로 맞춰집니다."}
            </div>
            {next && (
              <div>
                <div className="mb-1 text-[13px] text-muted">다음 페이지</div>
                <div className="font-semibold">{next.label}</div>
                <p className="mt-1 line-clamp-3 text-sm text-muted">{SCRIPT[next.id]?.say[0]}</p>
              </div>
            )}
            <nav>
              <div className="mb-1 text-[13px] text-muted">페이지</div>
              <ol className="grid">
                {PAGES.map((p, i) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => go(i)}
                      className={"grid w-full cursor-pointer grid-cols-[26px_1fr_auto] gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-sunk " + (i === cur ? "bg-sunk font-semibold text-rec" : "")}
                    >
                      <span className="font-mono text-muted tabular-nums">{pageNo(p.id)}</span>
                      <span className="truncate">{p.label}</span>
                      <span className="font-mono text-xs text-muted">{SCRIPT[p.id]?.min}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
