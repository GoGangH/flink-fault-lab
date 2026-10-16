import { PRESETS } from "./constants";
import { SimEngine } from "./engine";
import { STEP_SCRIPTS, type Step } from "./steps";
import type { Guarantee, Slot, StratId } from "./types";
import { SimView } from "./view";

/** 배속 단계. 1×는 시연하기 편하게 실제 시뮬레이션 시간의 BASE배로 흐른다 */
export const SPEEDS = [0.25, 0.5, 1, 1.5, 2];
const BASE = 0.6;

export type Mode = "live" | "step";

/** 단계별 모드 진행 상태 */
type Run = { steps: Step[]; idx: number; since: number; phase: "running" | "settling" | "waiting"; settleLeft: number; label: string };

/**
 * 시뮬레이터 마크업(root)에 엔진과 뷰를 붙이고 애니메이션 루프를 돌린다.
 * - 실시간 모드: 계속 흐르고, 시나리오 버튼은 정해진 시점에 자동으로 장애를 낸다.
 * - 단계별 모드: 시나리오 대본(steps.ts)의 한 단계씩 진행하고 멈춰서 설명을 띄운다. "다음"으로 넘어간다.
 * React 컴포넌트의 useEffect에서 호출하고, 돌려받은 함수로 정리한다.
 */
export function mountSimulator(root: HTMLElement): () => void {
  const eng = new SimEngine();
  const view = new SimView(root);
  let speed = 1;
  let paused = false;
  let mode: Mode = "step";
  let run: Run | null = null;

  const sync = () => {
    view.syncControls(eng, speed, paused);
    view.syncMode(mode, run && { idx: run.idx, total: run.steps.length, step: run.steps[run.idx], waiting: run.phase === "waiting", label: run.label }, eng);
  };
  const restart = () => {
    eng.reset();
    view.resetLog();
    sync();
    view.renderStage(eng);
    view.renderPanels(eng, mode);
  };
  const togglePause = () => {
    paused = !paused;
    sync();
  };

  const loadScenario = (id: string, label: string) => {
    const { auto, ...settings } = PRESETS[id];
    eng.settings = settings;
    paused = false;
    restart();
    eng.log("INFO", "scenario", `시나리오 시작: ${label}`);
    if (mode === "live") {
      eng.S.auto = auto.kills > 0 ? { ...auto } : null;
      run = null;
    } else {
      run = { steps: STEP_SCRIPTS[id], idx: 0, since: eng.S.evSeq, phase: "running", settleLeft: 0, label };
      beginStep(run.steps[0]);
    }
    eng.manualChk = mode === "step" && run?.steps[run.idx].chk !== "auto";
    sync();
  };

  const beginStep = (step: Step) => {
    eng.manualChk = step.chk !== "auto";
    step.act?.(eng);
    if (step.chk === "now") eng.triggerNow();
  };

  const nextStep = () => {
    if (!run) return;
    if (run.phase !== "waiting") return;
    if (run.idx >= run.steps.length - 1) return;
    run.idx++;
    run.since = eng.S.evSeq;
    run.phase = "running";
    paused = false;
    beginStep(run.steps[run.idx]);
    sync();
  };

  /** 단계별 모드: 조건을 만족하면 잠깐 더 돌린 뒤 멈춘다 */
  const advanceRun = (dt: number) => {
    if (!run || run.phase === "waiting") return;
    const step = run.steps[run.idx];
    if (run.phase === "running" && step.until(eng, run.since)) {
      run.phase = "settling";
      run.settleLeft = step.settle ?? 0;
    }
    if (run.phase === "settling") {
      if (run.settleLeft > 0) run.settleLeft -= dt;
      if (run.settleLeft <= 0) {
        run.phase = "waiting";
        sync();
      }
    }
  };

  const setMode = (m: Mode) => {
    if (m === mode) return;
    mode = m;
    loadScenario("normal", "정상 흐름");
  };

  const offs: (() => void)[] = [];
  const on = (sel: string, fn: (el: HTMLElement) => void) => {
    root.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      const h = () => fn(el);
      el.addEventListener("click", h);
      offs.push(() => el.removeEventListener("click", h));
    });
  };

  const manualKill = (s: Slot) => mode === "live" && eng.kill(s);
  on("#killA, #tmA-r", () => manualKill("A"));
  on("#killB, #tmB-r", () => manualKill("B"));
  on("[data-chk]", (el) => {
    const chk = el.dataset.chk === "on";
    if (eng.settings.chk !== chk) { eng.settings.chk = chk; restart(); }
  });
  on("[data-guarantee]", (el) => {
    const g = el.dataset.guarantee as Guarantee;
    if (eng.settings.guarantee !== g) { eng.settings.guarantee = g; restart(); }
  });
  on("[data-strat]", (el) => { eng.setStrategy(el.dataset.strat as StratId); sync(); });
  on("[data-speed-step]", (el) => {
    const i = SPEEDS.indexOf(speed) + Number(el.dataset.speedStep);
    speed = SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, i))];
    sync();
  });
  on("[data-mode]", (el) => setMode(el.dataset.mode as Mode));
  on("#pause", togglePause);
  on("#reset", () => (run ? loadScenario(scenarioOf(run), run.label) : restart()));
  on("#step-next", nextStep);
  on("[data-preset]", (el) => loadScenario(el.dataset.preset!, el.dataset.label ?? el.textContent?.trim() ?? ""));

  const scenarioOf = (r: Run) => Object.keys(STEP_SCRIPTS).find((k) => STEP_SCRIPTS[k] === r.steps) ?? "normal";

  // 시뮬레이터 페이지가 보일 때만: 1 / 2 장애, P 일시정지, Space·Enter 다음 단계
  const onKey = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea" || e.metaKey || e.ctrlKey || e.altKey) return;
    if (!root.closest("section")?.classList.contains("cur")) return;
    if (e.key === "1") manualKill("A");
    if (e.key === "2") manualKill("B");
    if (e.key === "p" || e.key === "P") togglePause();
    if ((e.key === " " || e.key === "Enter") && mode === "step" && tag !== "button") {
      e.preventDefault();
      nextStep();
    }
  };
  document.addEventListener("keydown", onKey);
  offs.push(() => document.removeEventListener("keydown", onKey));

  let lastT = performance.now(), panelAcc = 0, raf = 0;
  const frame = (now: number) => {
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;
    const holding = run?.phase === "waiting";
    if (!paused && !holding) {
      // 큰 dt를 잘게 나눠 레코드가 엣지를 건너뛰지 않게 한다
      const sub = dt * speed * BASE, n = Math.ceil(sub / 0.05);
      for (let i = 0; i < n; i++) {
        eng.step(sub / n);
        advanceRun(sub / n);
        if (run?.phase === "waiting") break;
      }
    }
    view.renderStage(eng);
    panelAcc += dt;
    if (panelAcc > 0.12) { panelAcc = 0; view.renderPanels(eng, mode); }
    raf = requestAnimationFrame(frame);
  };

  loadScenario("normal", "정상 흐름");
  raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf);
    offs.forEach((f) => f());
  };
}
