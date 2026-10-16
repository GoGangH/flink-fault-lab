"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { btn } from "@/lib/ui";

const PRESETS = [
  ["normal", "0", "정상 흐름", "장애 없이 checkpoint 한 바퀴"],
  ["loss", "1", "유실", "checkpoint 없이 장애"],
  ["dup", "2", "중복", "at-least-once Sink에서 장애"],
  ["eo", "3", "정확", "exactly-once Sink에서 장애"],
  ["align", "4", "정렬 중 장애", "Count가 barrier를 기다리는 순간 tm-2 종료"],
  ["giveup", "5", "포기", "장애가 연달아 나서 Job 실패"],
];
const STRATS = [
  ["fixed", "fixed-delay"],
  ["exponential", "exponential"],
  ["failure-rate", "failure-rate"],
  ["none", "none"],
];

const iconBtn = "grid size-8 cursor-pointer place-items-center rounded-md border border-line bg-surface text-ink hover:border-muted disabled:cursor-not-allowed disabled:opacity-35";
const divider = <span className="mx-1 h-6 w-px bg-line max-md:hidden" />;

/**
 * 그림 위 도구 막대: 시나리오 · 장애 주입 · 재생 · 설정.
 * 버튼 동작은 lib/simulator/mount.ts가 id·data-* 속성으로 연결한다.
 * 설정 창은 닫혀 있어도 DOM에 남겨 둔다 (mount가 처음에 버튼을 찾아 연결하기 때문).
 */
export default function SimToolbar() {
  const [open, setOpen] = useState(false);
  const pop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!pop.current?.parentElement?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-line px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-1.5" data-tour="sim-presets">
        <span className="mr-1 text-xs text-muted">시나리오</span>
        {PRESETS.map(([id, n, t, d]) => (
          <button key={id} type="button" data-preset={id} data-label={`${n}. ${t}`} title={d} className={btn}>
            <span className="text-muted">{n}</span> {t}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1" data-tour="sim-mode" role="group" aria-label="보기 방식">
        {divider}
        <button type="button" data-mode="step" className={btn} aria-pressed="true" title="한 장면씩 멈추며 설명">단계별</button>
        <button type="button" data-mode="live" className={btn} aria-pressed="false" title="계속 흐르게 두고 TM 박스를 눌러 장애 주입">실시간</button>
      </div>

      <div className="flex items-center gap-1" data-tour="sim-play">
        {divider}
        <button type="button" id="pause" data-paused="false" className={iconBtn + " group"} aria-label="일시정지" title="일시정지 (P)">
          <span className="group-data-[paused=true]:hidden"><Icon name="pause" /></span>
          <span className="hidden group-data-[paused=true]:block"><Icon name="play" /></span>
        </button>
        <button type="button" id="reset" className={iconBtn} aria-label="처음부터" title="처음부터">
          <Icon name="restart" />
        </button>
        <button type="button" data-speed-step="-1" className={iconBtn} aria-label="느리게" title="느리게">
          <Icon name="slower" />
        </button>
        <span id="speed-label" className="w-10 text-center font-mono text-[13px] tabular-nums">1×</span>
        <button type="button" data-speed-step="1" className={iconBtn} aria-label="빠르게" title="빠르게">
          <Icon name="faster" />
        </button>
      </div>

      <div className="relative" data-tour="sim-settings">
        <button type="button" className={iconBtn} aria-label="설정" title="설정" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <Icon name="settings" />
        </button>
        <div
          ref={pop}
          hidden={!open}
          role="dialog"
          aria-label="시뮬레이션 설정"
          className="absolute top-10 right-0 z-20 w-[min(340px,calc(100vw-32px))] rounded-lg border border-line bg-surface p-4 shadow-lg"
        >
          <div className="mb-3 flex items-center">
            <h4 className="text-sm font-semibold">설정</h4>
            <button type="button" className="ml-auto cursor-pointer text-muted hover:text-ink" aria-label="설정 닫기" onClick={() => setOpen(false)}>
              <Icon name="close" />
            </button>
          </div>
          <div className="grid grid-cols-[72px_1fr] items-center gap-x-2 gap-y-2.5 text-xs text-muted">
            <span>Checkpoint</span>
            <div className="flex flex-wrap gap-1.5">
              <button className={btn} id="chk-on" data-chk="on" type="button" aria-pressed="true">켜기</button>
              <button className={btn} id="chk-off" data-chk="off" type="button" aria-pressed="false">끄기</button>
            </div>
            <span>Sink</span>
            <div className="flex flex-wrap gap-1.5">
              <button className={btn} id="g-eo" data-guarantee="eo" type="button" aria-pressed="true">exactly-once</button>
              <button className={btn} id="g-al" data-guarantee="al" type="button" aria-pressed="false">at-least-once</button>
            </div>
            <span className="self-start pt-1.5">재시작 전략</span>
            <div className="flex flex-wrap gap-1.5">
              {STRATS.map(([id, t]) => (
                <button key={id} className={btn} data-strat={id} type="button" aria-pressed={id === "fixed"}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <pre className="mt-3 overflow-x-auto rounded-md bg-sunk px-2.5 py-2 font-mono text-[11px] leading-relaxed" id="strat-conf" />
          <p className="mt-1.5 text-xs text-muted" id="strat-desc" />
          <p className="mt-2 text-xs text-muted">Checkpoint와 Sink를 바꾸면 처음부터 다시 시작합니다.</p>
        </div>
      </div>
    </div>
  );
}
