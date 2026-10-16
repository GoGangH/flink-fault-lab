import type { AutoKill, Idx, Key, Op, Settings, Slot, StratId, SubId } from "./types";

/** 파티션마다 다른 단어 순서. 두 파티션 모두 A와 B가 섞여 있어 keyBy가 TM을 건너는 장면이 생긴다 */
const KEYS: [string, string] = ["ABAABBAB", "BABBAABA"];
export const keyOf = (i: Idx, o: number) => KEYS[i][o % KEYS[i].length] as Key;

/** keyBy: key → 담당 Count subtask. A는 Count[0], B는 Count[1] */
export const route = (k: Key): Idx => (k === "B" ? 1 : 0);
export const KEYS_OF: [Key[], Key[]] = [["A"], ["B"]];

export const IDX: Idx[] = [0, 1];
export const OPS: Op[] = ["source", "count", "sink"];
export const SUBS: SubId[] = ["source0", "count0", "sink0", "source1", "count1", "sink1"];
export const slotOf = (i: Idx): Slot => (i === 0 ? "A" : "B");
export const idxOf = (s: Slot): Idx => (s === "A" ? 0 : 1);

/** 시뮬레이션 시간(초). 시연용으로 압축한 값이다. */
export const TIMING = {
  produce: 1.3, read: 1.3, catchup: 0.35, chk: 6,
  fetch: 0.5,
  /** 출력 버퍼: 최소 머무는 시간(buffer timeout을 압축), 연속 전송 간격 */
  bufDwell: 0.8,
  bufGap: 0.3,
  /** 같은 TM 안 채널 / TM을 건너는 채널 */
  shuffle: { same: 0.8, cross: 1.5 },
  fwd: 0.6,
  /** 저장소까지: tm-1 몫은 길이 길다 */
  ack: [1.4, 0.7] as [number, number],
  fx: { trigger: 0.7, commit: 0.8, write: 0.5 },
  /** trigger는 경로 길이에 비례: Source[1]이 더 멀다 */
  triggerScale: [1, 1.8] as [number, number],
};
export const PHASE_TIME = { fail: 0.7, detect: 1.8, failover: 0.9, slots: 1.2, restore: 1.1 };

export const STRATS: Record<StratId, { conf: string; desc: string }> = {
  fixed: {
    conf: "restart-strategy.type: fixed-delay\nrestart-strategy.fixed-delay.attempts: 3\nrestart-strategy.fixed-delay.delay: 2 s",
    desc: "최대 3번까지 2초 간격으로 재시작합니다. 4번째 장애에서 Job이 FAILED가 됩니다.",
  },
  exponential: {
    conf: "restart-strategy.type: exponential-delay\nrestart-strategy.exponential-delay.initial-backoff: 1 s\nrestart-strategy.exponential-delay.backoff-multiplier: 2.0\nrestart-strategy.exponential-delay.max-backoff: 8 s\nrestart-strategy.exponential-delay.reset-backoff-threshold: 30 s",
    desc: "재시작할 때마다 대기 시간이 1 → 2 → 4 → 8초로 늘어납니다. 30초 동안 장애가 없으면 다시 1초부터.",
  },
  "failure-rate": {
    conf: "restart-strategy.type: failure-rate\nrestart-strategy.failure-rate.max-failures-per-interval: 3\nrestart-strategy.failure-rate.failure-rate-interval: 30 s\nrestart-strategy.failure-rate.delay: 1500 ms",
    desc: "30초 안에 장애가 3번 쌓이면 Job이 FAILED가 됩니다. 띄엄띄엄 나는 장애는 계속 재시작합니다.",
  },
  none: { conf: "restart-strategy.type: none", desc: "재시작하지 않습니다. 첫 장애에서 Job이 FAILED가 됩니다." },
};

export const SUB_NAME = (s: SubId) => {
  const op = s.slice(0, -1) as Op, i = Number(s.slice(-1));
  return `${{ source: "Source: Kafka", count: "KeyedCount", sink: "Sink: Kafka" }[op]} (${i + 1}/2)`;
};

export const PRESETS: Record<string, Settings & { auto: AutoKill }> = {
  normal: { chk: true, guarantee: "eo", strat: "fixed", auto: { kills: 0, wait: 0, between: 0, slot: "A" } },
  loss: { chk: false, guarantee: "al", strat: "fixed", auto: { kills: 1, wait: 9, between: 2, slot: "A" } },
  dup: { chk: true, guarantee: "al", strat: "fixed", auto: { kills: 1, wait: 10.5, between: 2, slot: "A" } },
  eo: { chk: true, guarantee: "eo", strat: "fixed", auto: { kills: 1, wait: 10.5, between: 2, slot: "A" } },
  giveup: { chk: true, guarantee: "eo", strat: "fixed", auto: { kills: 4, wait: 9, between: 1.5, slot: "A" } },
  align: { chk: true, guarantee: "eo", strat: "fixed", auto: { kills: 1, wait: 8, between: 2, slot: "B", align: true } },
};

type Pt = [number, number];

/**
 * ClusterStage SVG 좌표 (viewBox 0 0 1200 930)
 *   [ Kafka orders: orders-0 | orders-1 ] ←쓰기── [ Producer ]
 *              [ JobManager ]                      [ Checkpoint 저장소 ]
 *            ↙                ↘                    [  chk-N/            ]
 *   [ tm-1: Source[0] ]   [ tm-2: Source[1] ]  │   [   tm-1 파일 3개    ]
 *   [   ╲   keyBy   ╳   ╱                  ]  │   [   tm-2 파일 3개    ]
 *   [   Count[0]      ]   [   Count[1]      ]  │   [   _metadata        ]
 *   [   Sink[0]       ]   [   Sink[1]       ]  │
 *   [ Kafka word-counts: -0 | -1 ]
 */
const COL: [number, number] = [200, 560];
const MID = 380; // 두 TM 사이 통로
const BOTTOM_LANE = 776; // Sink 아래 통로
const BUS = 784; // 저장소 앞 세로 통로
const JM = { x: 280, y: 120, w: 200, h: 84 };
const TM_Y = 226;

export const GEO = {
  jm: JM,
  producer: { x: 800, y: 10, w: 380, h: 96 },
  inTopic: { x: 40, y: 10, w: 680, h: 96 },
  outTopic: { x: 40, y: 816, w: 680, h: 104 },
  cells: { in: 8, inW: 36, out: 6, outW: 48, inTop: 32, outTop: 846 },
  col: COL,
  tm: [{ x: 40, y: TM_Y, w: 320, h: 566 }, { x: 400, y: TM_Y, w: 320, h: 566 }],
  box: { w: 280 },
  /** Source 박스는 안에 출력 네트워크 버퍼까지 담는다 */
  row: { source: { y: 254, h: 168 }, count: { y: 496, h: 122 }, sink: { y: 672, h: 94 } } as Record<Op, { y: number; h: number }>,
  /**
   * Source[i]의 출력 버퍼(하나) 안의 칸 두 개: Count[0] 칸은 왼쪽, Count[1] 칸은 오른쪽. 항목은 가운데에서 들어와 바깥쪽 끝으로 나간다.
   */
  buf: { y: 352, h: 28, w: 128, slot: 30, max: 4 },
  bufSlot: (i: Idx, to: Idx, k: number): Pt => {
    const b = GEO.buf, y = b.y + 4 + b.h / 2;
    return to === 0 ? [COL[i] - 6 - b.w + 15 + k * b.slot, y] : [COL[i] + 6 + b.w - 15 - k * b.slot, y];
  },
  /** 채널 시작(버퍼 출구 아래)과 끝(Count 위 입구) */
  chanStart: (i: Idx, to: Idx): Pt => [to === 0 ? COL[i] - 6 - GEO.buf.w + 15 : COL[i] + 6 + GEO.buf.w - 15, 422],
  chanEnd: (from: Idx, j: Idx): Pt => [COL[j] + (from === 0 ? -22 : 22), 496],
  /** 저장소 하나. 안에 subtask별 파일 칸과 _metadata 칸 */
  store: { x: 800, y: 122, w: 380, h: 560 },
  slot: { x: 812, w: 356, h: 50 },
  slotY: { source0: 222, count0: 278, sink0: 334, source1: 418, count1: 474, sink1: 530, meta: 614 } as Record<SubId | "meta", number>,
  lanes: { mid: MID, bottom: BOTTOM_LANE, bus: BUS },
  /** JM ↔ TM heartbeat: 가운데 JM에서 좌우 TM으로 */
  heartbeat: [
    [[JM.x + 14, JM.y + JM.h], [JM.x + 14, TM_Y - 8], [360, TM_Y - 8], [345, TM_Y]],
    [[JM.x + JM.w - 14, JM.y + JM.h], [JM.x + JM.w - 14, TM_Y - 8], [400, TM_Y - 8], [415, TM_Y]],
  ] as Pt[][],
  /** JM → Source[i] checkpoint 시작 요청: 가운데에서 좌우로 갈라져 Source 위로 들어간다 */
  trigger: [
    [[JM.x + 60, JM.y + JM.h], [JM.x + 60, 238], [COL[0] + 60, 238], [COL[0] + 60, 254]],
    [[JM.x + JM.w - 60, JM.y + JM.h], [JM.x + JM.w - 60, 238], [COL[1] - 60, 238], [COL[1] - 60, 254]],
  ] as Pt[][],
  /** JM → Sink[j] checkpoint 완료 알림: TM 사이 통로로 내려가 Sink 옆구리로 */
  commit: [
    [[MID - 6, JM.y + JM.h], [MID - 6, 719], [COL[0] + 140, 719]],
    [[MID + 6, JM.y + JM.h], [MID + 6, 719], [COL[1] - 140, 719]],
  ] as Pt[][],
};

/**
 * subtask → 저장소 칸으로 가는 길.
 * tm-1 몫은 TM 왼쪽 안쪽 통로로 내려가 아래 통로를 지나 저장소 앞 통로로, tm-2 몫은 오른쪽으로 바로 간다.
 */
export function ackPath(sub: SubId): Pt[] {
  const op = sub.slice(0, -1) as Op, i = Number(sub.slice(-1)) as Idx;
  const r = GEO.row[op], y = r.y + r.h / 2 + 22;
  const sy = GEO.slotY[sub] + GEO.slot.h / 2;
  const lane = BOTTOM_LANE + { source: -8, count: 0, sink: 8 }[op];
  const left = COL[0] - GEO.box.w / 2, right = COL[1] + GEO.box.w / 2;
  return i === 0
    ? [[left, y], [50, y], [50, lane], [BUS, lane], [BUS, sy], [GEO.slot.x, sy]]
    : [[right, y], [BUS, y], [BUS, sy], [GEO.slot.x, sy]];
}

/** 꺾은선 경로 위의 위치 (p: 0~1) */
export function along(path: Pt[], p: number): Pt {
  const seg = path.slice(1).map((b, i) => {
    const a = path[i];
    return { a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) };
  });
  let d = Math.max(0, Math.min(1, p)) * seg.reduce((s, x) => s + x.len, 0);
  for (const { a, b, len } of seg) {
    if (d <= len) return [a[0] + ((b[0] - a[0]) * d) / len, a[1] + ((b[1] - a[1]) * d) / len];
    d -= len;
  }
  return path[path.length - 1];
}
