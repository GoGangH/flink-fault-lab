/** 여러 컴포넌트에서 반복되는 Tailwind 클래스 묶음 */

// 크기·모양만. 색은 아래 변형마다 따로 지정해 클래스끼리 충돌하지 않게 한다.
const btnBase =
  "cursor-pointer rounded-lg border px-3 py-1.5 text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-40";

export const btn =
  btnBase +
  " border-line bg-surface text-ink hover:border-muted aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-bg";

export const btnPrime = btnBase + " border-rec bg-rec font-semibold text-rec-ink hover:brightness-110";

export const btnKill = btnBase + " border-fail bg-fail-tint font-semibold text-fail hover:bg-fail hover:text-surface";

export const card = "rounded-lg border border-line bg-surface p-5";

export const label = "text-xs font-medium text-muted";

export const note = "mt-2 text-[12.5px] text-muted";

export const pre = "overflow-x-auto rounded-lg bg-sunk px-3.5 py-3 font-mono text-[12.5px] leading-relaxed text-ink";
