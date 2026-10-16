"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { btn } from "@/lib/ui";
import type { PageInfo } from "@/lib/pages";
import { TOURS } from "@/lib/tours";
import Tour from "@/components/tour/Tour";
import TocDrawer from "./TocDrawer";
import { openDeckChannel } from "@/lib/deckChannel";

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

/**
 * 섹션(<section id>)을 한 장씩 넘겨 보는 덱. 현재 페이지는 URL hash에 둔다.
 * 시뮬레이터 상태가 유지되도록 모든 섹션은 마운트된 채로 두고 .cur 클래스로만 보여준다.
 * 상단 메뉴 아래 가는 막대가 진행 상태다. 목차(TocDrawer)와 페이지별 스포트라이트 가이드(Tour)도 여기서 연다.
 */
export default function Deck({ pages, children }: { pages: PageInfo[]; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => "");
  const cur = Math.max(0, pages.findIndex((p) => "#" + p.id === hash));
  const [tocOpen, setTocOpen] = useState(false);
  const [touring, setTouring] = useState(false);

  const go = (i: number) => {
    const n = Math.max(0, Math.min(pages.length - 1, i));
    window.location.hash = pages[n].id;
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("ready");
    el.querySelectorAll<HTMLElement>(":scope > section").forEach((s, k) => s.classList.toggle("cur", k === cur));
    window.scrollTo(0, 0);
  }, [cur]);

  // 발표자 대본 창(/대본)과 현재 페이지 동기화
  const pageId = pages[cur].id;
  const channel = useRef<ReturnType<typeof openDeckChannel> | null>(null);
  useEffect(() => {
    const ch = openDeckChannel((m) => {
      if (m.type === "go" && pages.some((p) => p.id === m.id)) window.location.hash = m.id;
      if (m.type === "hello") ch.post({ type: "page", id: window.location.hash.slice(1) || pages[0].id });
    });
    channel.current = ch;
    return () => ch.close();
  }, [pages]);
  useEffect(() => {
    channel.current?.post({ type: "page", id: pageId });
  }, [pageId]);

  useEffect(() => {
    const start = () => {
      setTocOpen(false);
      setTouring(true);
    };
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || e.metaKey || e.ctrlKey || e.altKey) return;
      const i = Math.max(0, pages.findIndex((p) => "#" + p.id === window.location.hash));
      const to = (n: number) => (window.location.hash = pages[Math.max(0, Math.min(pages.length - 1, n))].id);
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); to(i + 1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); to(i - 1); }
      if (e.key === "t" || e.key === "T") setTocOpen((o) => !o);
      if (e.key === "g" || e.key === "G") start();
      if (e.key === "Escape") setTocOpen(false);
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("tour:start", start);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("tour:start", start);
    };
  }, [pages]);

  const page = pages[cur];
  const nextPage = pages[cur + 1];
  const steps = TOURS[page.id] ?? [];

  return (
    <>
      <nav className="sticky top-[env(safe-area-inset-top,0px)] z-10 -mx-[max(16px,env(safe-area-inset-left,0px))] border-b border-line bg-bg/90 px-[max(16px,env(safe-area-inset-left,0px))] py-2.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-[18px] gap-y-1.5">
          <div className="mr-auto text-sm font-bold">
            Flink 장애 복구 랩 <span className="font-medium text-muted max-sm:hidden">· Fault Tolerance</span>
          </div>
          <div className="flex min-w-0 items-baseline gap-2 text-[13px] max-sm:hidden">
            <span className="text-muted">{page.part}</span>
            <span className="truncate font-semibold">{page.label}</span>
          </div>
          {steps.length > 0 && (
            <button type="button" data-tour="guide" className={btn} onClick={() => setTouring(true)} title="이 페이지 가이드 (G)">
              가이드
            </button>
          )}
          <button type="button" data-tour="toc" className={btn} onClick={() => setTocOpen(true)} title="목차 (T)">
            목차
          </button>
        </div>
        <div
          className="absolute inset-x-0 bottom-0 h-0.5"
          role="progressbar"
          aria-label="발표 진행"
          aria-valuemin={1}
          aria-valuemax={pages.length}
          aria-valuenow={cur + 1}
        >
          <i className="block h-full bg-rec transition-[width] duration-300" style={{ width: ((cur + 1) / pages.length) * 100 + "%" }} />
        </div>
      </nav>

      <div className="deck mx-auto max-w-[1120px]" ref={ref}>
        {children}
      </div>

      <TocDrawer
        open={tocOpen}
        current={page.id}
        onClose={() => setTocOpen(false)}
        onGo={(id) => {
          setTocOpen(false);
          window.location.hash = id;
        }}
      />

      {touring && steps.length > 0 && (
        <Tour
          key={page.id}
          steps={steps}
          pageLabel={page.label}
          nextPageLabel={nextPage && TOURS[nextPage.id]?.length ? `다음: ${nextPage.label}` : null}
          onNextPage={() => go(cur + 1)}
          onClose={() => setTouring(false)}
        />
      )}
    </>
  );
}
