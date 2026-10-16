"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { btn, btnPrime } from "@/lib/ui";
import type { TourStep } from "@/lib/tours";

type Rect = { x: number; y: number; w: number; h: number };

const PAD = 8;
const CARD_W = 360;
const CARD_MIN_SPACE = 210;

function findTarget(target: string) {
  return target.startsWith("@")
    ? document.querySelector<HTMLElement>(`[data-tour="${target.slice(1)}"]`)
    : document.querySelector<HTMLElement>(`section.cur [data-tour="${target}"]`);
}

type Props = {
  steps: TourStep[];
  pageLabel: string;
  nextPageLabel: string | null;
  onNextPage: () => void;
  onClose: () => void;
};

/**
 * 스포트라이트 가이드. 대상 요소만 밝게 남기고 나머지는 어둡게·흐리게 덮은 뒤 설명 카드를 띄운다.
 * 페이지가 바뀌면 Deck이 key를 바꿔 새로 마운트하므로 단계는 0부터 다시 시작한다.
 */
export default function Tour({ steps, pageLabel, nextPageLabel, onNextPage, onClose }: Props) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [view, setView] = useState({ w: 0, h: 0 });
  const scrolledFor = useRef(-1);
  const step = steps[i];
  const last = i === steps.length - 1;

  // 대상 위치를 매 프레임 추적 (스크롤, 리사이즈, 애니메이션에도 따라붙게)
  useEffect(() => {
    if (!step) return;
    let raf = 0;
    const tick = () => {
      const el = findTarget(step.target);
      if (el) {
        if (scrolledFor.current !== i) {
          scrolledFor.current = i;
          const tall = el.getBoundingClientRect().height > window.innerHeight * 0.6;
          el.scrollIntoView({ block: tall ? "start" : "center", behavior: "smooth" });
        }
        const r = el.getBoundingClientRect();
        const next = { x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 };
        setRect((p) => (p && Math.abs(p.x - next.x) < 0.5 && Math.abs(p.y - next.y) < 0.5 && Math.abs(p.w - next.w) < 0.5 && Math.abs(p.h - next.h) < 0.5 ? p : next));
      }
      setView((v) => (v.w === window.innerWidth && v.h === window.innerHeight ? v : { w: window.innerWidth, h: window.innerHeight }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, i]);

  const next = () => (last ? (nextPageLabel ? onNextPage() : onClose()) : setI(i + 1));
  const prev = () => setI(Math.max(0, i - 1));

  // 가이드 중에는 키 입력을 가이드가 먼저 가져간다 (페이지 넘김·시뮬레이터 단축키보다 앞서 capture 단계에서)
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    const k = e.key;
    if (!["ArrowRight", "ArrowLeft", "Escape", "Enter", " ", "PageDown", "PageUp", "1", "2", "p", "P", "g", "G", "t", "T"].includes(k)) return;
    e.preventDefault();
    e.stopPropagation();
    if (k === "ArrowRight" || k === "Enter" || k === " " || k === "PageDown") next();
    if (k === "ArrowLeft" || k === "PageUp") prev();
    if (k === "Escape") onClose();
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, []);

  if (!step) return null;

  const r = rect;
  const vw = view.w || 1200, vh = view.h || 800;
  const cardW = Math.min(CARD_W, vw - 32);

  let cardStyle: React.CSSProperties = { width: cardW, left: (vw - cardW) / 2, bottom: 24 };
  if (r) {
    const left = Math.min(Math.max(r.x, 16), vw - cardW - 16);
    const below = vh - (r.y + r.h), above = r.y;
    if (below >= CARD_MIN_SPACE) cardStyle = { width: cardW, left, top: r.y + r.h + 12 };
    else if (above >= CARD_MIN_SPACE) cardStyle = { width: cardW, left, bottom: vh - r.y + 12 };
  }

  const dim = "fixed bg-black/55 backdrop-blur-[3px] transition-all duration-300 ease-out";

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`${pageLabel} 가이드`}>
      {r ? (
        <>
          <div className={dim} style={{ left: 0, top: 0, width: "100%", height: Math.max(0, r.y) }} />
          <div className={dim} style={{ left: 0, top: r.y + r.h, width: "100%", bottom: 0 }} />
          <div className={dim} style={{ left: 0, top: r.y, width: Math.max(0, r.x), height: r.h }} />
          <div className={dim} style={{ left: r.x + r.w, top: r.y, right: 0, height: r.h }} />
          <div
            className="pointer-events-none fixed rounded-lg ring-2 ring-rec transition-all duration-300 ease-out"
            style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
          />
        </>
      ) : (
        <div className={dim + " inset-0"} />
      )}

      <div
        className="fixed rounded-lg border border-line bg-surface p-5 text-ink shadow-lg transition-all duration-300 ease-out"
        style={cardStyle}
      >
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-muted">
            {pageLabel} · {i + 1}/{steps.length}
          </span>
          <button type="button" onClick={onClose} className="ml-auto cursor-pointer rounded-md px-1.5 text-lg leading-none text-muted hover:text-ink" aria-label="가이드 닫기">
            ×
          </button>
        </div>
        <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{step.body}</p>
        <div className="mt-4 flex items-center gap-2">
          <span className="mr-auto" />
          <button type="button" className={btn} onClick={prev} disabled={i === 0}>
            이전
          </button>
          <button type="button" className={btnPrime} onClick={next} autoFocus>
            {!last ? "다음" : nextPageLabel ? nextPageLabel : "끝내기"}
          </button>
        </div>
      </div>
    </div>
  );
}
