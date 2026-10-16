export type Ev = { k: "run"; a: number; b: number } | { k: "wait"; a: number; b: number; d: number } | { k: "fail"; a: number; final?: boolean };

export const STRATEGIES = [
  { id: "fixed-delay", cfg: "attempts=3 · delay=10s" },
  { id: "failure-rate", cfg: "2분 안에 3번 · delay=10s" },
  { id: "exponential-delay", cfg: "1s×2, 최대 60s · 60s 안정 시 초기화" },
  { id: "none", cfg: "재시작 안 함" },
];

/** 장애 패턴: Job이 다시 뜬 뒤 gap초 지나면 또 죽는 일이 n번 반복된다 */
export const PATTERNS = {
  burst: {
    label: "장애가 몰려서 날 때",
    desc: "다시 뜬 뒤 10초마다 장애, 6번",
    gap: 10,
    n: 6,
    takeaway:
      "짧은 시간에 장애가 몰리면 failure-rate와 fixed-delay는 곧 포기합니다. exponential-delay는 대기 시간을 늘려 가며 계속 버팁니다. 원인이 금방 안 풀리는 장애라면 대기를 늘리는 쪽이 외부 시스템에 부담을 덜 줍니다.",
  },
  sparse: {
    label: "장애가 가끔 날 때",
    desc: "다시 뜬 뒤 5분마다 장애, 6번",
    gap: 300,
    n: 6,
    takeaway:
      "띄엄띄엄 나는 장애에는 failure-rate와 exponential-delay가 계속 버팁니다(exponential은 매번 1초로 초기화). fixed-delay는 시간과 관계없이 총 횟수로 세서, 가끔 나는 장애에도 결국 Job을 멈춥니다.",
  },
};
export type PatternId = keyof typeof PATTERNS;

const RESET_AFTER = 60;

export function simulate(id: string, gap: number, n: number) {
  const ev: Ev[] = [];
  const fails: number[] = [];
  let t = 0, restarts = 0, failed = false, backoff = 1;
  for (let i = 0; i < n; i++) {
    const ft = t + gap;
    ev.push({ k: "run", a: t, b: ft });
    fails.push(ft);
    let d: number | null = null;
    if (id === "fixed-delay") d = restarts < 3 ? 10 : null;
    else if (id === "failure-rate") {
      // 최근 3번의 장애가 2분 안에 몰려 있으면 포기
      const l = fails.slice(-3);
      d = l.length >= 3 && ft - l[0] < 120 ? null : 10;
    } else if (id === "exponential-delay") {
      // 직전 재시작 뒤 60초 이상 안정적으로 돌았으면 대기 시간을 처음으로 되돌린다
      if (gap >= RESET_AFTER) backoff = 1;
      d = Math.min(60, backoff);
      backoff = Math.min(60, backoff * 2);
    }
    if (d == null) {
      ev.push({ k: "fail", a: ft, final: true });
      failed = true;
      t = ft;
      break;
    }
    ev.push({ k: "fail", a: ft });
    ev.push({ k: "wait", a: ft, b: ft + d, d });
    restarts++;
    t = ft + d;
  }
  if (!failed) ev.push({ k: "run", a: t, b: t + gap * 0.4 });
  const waited = ev.reduce((s, e) => s + (e.k === "wait" ? e.d : 0), 0);
  return { ev, restarts, failed, waited, end: failed ? t : t + gap * 0.4 };
}
