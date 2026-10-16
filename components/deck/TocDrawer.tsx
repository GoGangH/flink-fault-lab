"use client";

import { useEffect, useRef } from "react";
import PageList from "./PageList";

/** 오른쪽에서 열리는 목차. 현재 페이지를 표시하고, 누르면 그 페이지로 이동한다. */
export default function TocDrawer({ open, current, onGo, onClose }: { open: boolean; current: string; onGo: (id: string) => void; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLElement>("[aria-current='page']")?.focus();
  }, [open]);

  return (
    <div className={"fixed inset-0 z-40 " + (open ? "" : "pointer-events-none")} aria-hidden={!open} inert={!open}>
      <div className={"absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 " + (open ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-label="목차"
        className={
          "absolute top-0 right-0 bottom-0 w-[min(340px,100vw)] overflow-y-auto border-l border-line bg-surface pt-[calc(18px+env(safe-area-inset-top,0px))] pr-[max(16px,env(safe-area-inset-right,0px))] pb-[calc(18px+env(safe-area-inset-bottom,0px))] pl-4 shadow-lg transition-transform duration-300 ease-out " +
          (open ? "translate-x-0" : "translate-x-full")
        }
      >
        <div className="mb-4 flex items-center px-2">
          <h2 className="text-base font-bold">목차</h2>
          <button type="button" onClick={onClose} className="ml-auto cursor-pointer rounded-md px-2 text-xl leading-none text-muted hover:text-ink" aria-label="목차 닫기">
            ×
          </button>
        </div>
        <PageList compact current={current} onSelect={onGo} />
      </div>
    </div>
  );
}
