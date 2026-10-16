/** barrier 정렬 스텝퍼의 단계별 배치. 좌표는 BarrierStepper SVG(viewBox 800×250) 기준. */

export type Pos = [x: number, y: number, opacity: number, cls?: string];
export type Step = { t: string; d: string; pos: Record<string, Pos>; op: string; sub: string; snap: string; cls: string; src: [string, string]; store: string };

const Y1 = 70, Y2 = 170, YO = 120;
export const ITEMS: [id: string, kind: "r" | "b", label: string, y: number][] = [
  ["a1", "r", "a1", Y1], ["a2", "r", "a2", Y1], ["a3", "r", "a3", Y1], ["a4", "r", "a4", Y1],
  ["b1", "r", "b1", Y2], ["b2", "r", "b2", Y2], ["b3", "r", "b3", Y2], ["b4", "r", "b4", Y2],
  ["bar1", "b", "8", Y1], ["bar2", "b", "8", Y2], ["bar3", "b", "8", YO],
];
// HS: 아직 Source 안 · HI: 연산자가 소비함 · v: 채널 위에 보임
const HS = (y: number): Pos => [128, y, 0];
export const HI = (y: number): Pos => [600, y, 0];
const v = (x: number, y: number, c = ""): Pos => [x, y, 1, c];
const OUT_HIDDEN: Pos = [690, YO, 0];
const OUT_GONE: Pos = [790, YO, 0];
const consumedAll = { a1: HI(Y1), a2: HI(Y1), a3: HI(Y1), bar1: HI(Y1), a4: HI(Y1), b1: HI(Y2), b2: HI(Y2), b3: HI(Y2), bar2: HI(Y2), b4: HI(Y2) };

const s0: Step = {
  t: "평상시",
  d: "두 Source에서 레코드가 KeyedCount로 들어옵니다. 연산자 state는 지금까지 센 개수입니다.",
  pos: { a1: v(330, Y1), a2: v(260, Y1), a3: v(190, Y1), a4: HS(Y1), b1: v(360, Y2), b2: v(290, Y2), b3: v(220, Y2), b4: HS(Y2), bar1: HS(Y1), bar2: HS(Y2), bar3: OUT_HIDDEN },
  op: "count = 12", sub: "", snap: "", cls: "", src: ["", ""], store: "이전 checkpoint chk-7",
};
const s1: Step = {
  t: "Source에 barrier 주입",
  d: "CheckpointCoordinator가 checkpoint 8을 시작합니다. 각 Source는 현재 offset을 저장하고, barrier를 데이터 사이에 끼워 보냅니다. barrier 앞의 레코드는 checkpoint 8에 포함되고, 뒤의 레코드는 다음 checkpoint 몫입니다.",
  pos: { a1: v(400, Y1), a2: v(330, Y1), a3: v(260, Y1), bar1: v(205, Y1), a4: v(150, Y1), b1: v(430, Y2), b2: v(360, Y2), b3: v(290, Y2), bar2: v(235, Y2), b4: v(180, Y2), bar3: OUT_HIDDEN },
  op: "count = 12", sub: "", snap: "", cls: "", src: ["offset 3 저장", "offset 3 저장"], store: "chk-8 저장 중 · Source 1 offset 3 · Source 2 offset 3",
};

export const ALIGNED: Step[] = [
  s0,
  s1,
  {
    t: "채널 1의 barrier가 먼저 도착 → 정렬 대기",
    d: "채널 1은 barrier가 왔지만 채널 2는 아직입니다. 지금 채널 1의 a4를 처리하면 checkpoint 8 이후 데이터가 state에 섞입니다. 그래서 채널 1을 막아 두고 채널 2만 계속 처리합니다. 이것이 barrier alignment입니다.",
    pos: { a1: HI(Y1), a2: HI(Y1), a3: HI(Y1), bar1: v(508, Y1), a4: v(455, Y1, "blocked"), b1: HI(Y2), b2: v(470, Y2), b3: v(400, Y2), bar2: v(345, Y2), b4: v(290, Y2), bar3: OUT_HIDDEN },
    op: "count = 16", sub: "채널 1 차단 중", snap: "", cls: "", src: ["", ""], store: "chk-8 저장 중 · Source 1 offset 3 · Source 2 offset 3",
  },
  {
    t: "두 barrier가 모두 도착 → 스냅샷",
    d: "채널 2의 barrier까지 도착하면 state는 정확히 \"barrier 이전 데이터만 반영한\" 값(18)입니다. 이 값을 checkpoint 저장소로 비동기 업로드합니다. 업로드를 기다리지 않고 처리를 계속할 수 있습니다.",
    pos: { a1: HI(Y1), a2: HI(Y1), a3: HI(Y1), bar1: v(508, Y1), a4: v(455, Y1, "blocked"), b1: HI(Y2), b2: HI(Y2), b3: HI(Y2), bar2: v(508, Y2), b4: v(455, Y2), bar3: OUT_HIDDEN },
    op: "count = 18", sub: "스냅샷 생성", snap: "snapshot: count = 18 → S3", cls: "snap", src: ["", ""], store: "chk-8 저장 중 · offset 3, 3 + KeyedCount state 18",
  },
  {
    t: "barrier를 다운스트림으로 전달, 처리 재개",
    d: "연산자는 barrier를 출력 채널로 내보내고 막아 둔 채널 1을 풉니다. 이제 a4, b4가 처리되어 count는 20이 되지만, 저장된 스냅샷은 18 그대로입니다.",
    pos: { ...consumedAll, bar3: v(720, YO) },
    op: "count = 20", sub: "", snap: "스냅샷은 18 그대로", cls: "", src: ["", ""], store: "chk-8 저장 중 · offset 3, 3 + KeyedCount state 18",
  },
  {
    t: "모든 Task ack → checkpoint 완료",
    d: "Sink까지 barrier가 도착해 모든 Task가 ack를 보내면 JobManager가 checkpoint 8을 완료로 기록합니다. 이후 장애가 나면 Source는 offset 3으로, 연산자는 count = 18로 돌아갑니다.",
    pos: { ...consumedAll, bar3: OUT_GONE },
    op: "count = 20", sub: "", snap: "chk-8 COMPLETED", cls: "done", src: ["", ""], store: "chk-8 완료 = offset 3, 3 + KeyedCount state 18",
  },
];

export const UNALIGNED: Step[] = [
  s0,
  s1,
  {
    t: "첫 barrier가 도착하면 바로 스냅샷",
    d: "Unaligned 모드는 정렬을 기다리지 않습니다. 첫 barrier가 오면 즉시 state(16)를 찍고, 다른 채널에서 barrier보다 앞에 있던 b2, b3을 in-flight 데이터로 함께 저장합니다. barrier는 곧바로 다운스트림으로 나갑니다.",
    pos: { a1: HI(Y1), a2: HI(Y1), a3: HI(Y1), bar1: HI(Y1), a4: v(455, Y1), b1: HI(Y2), b2: v(470, Y2, "saved"), b3: v(400, Y2, "saved"), bar2: v(345, Y2), b4: v(290, Y2), bar3: v(720, YO) },
    op: "count = 16", sub: "채널 차단 없음", snap: "snapshot: 16 + in-flight [b2, b3]", cls: "snap", src: ["", ""], store: "chk-8 저장 중 · offset 3, 3 + state 16 + in-flight [b2, b3]",
  },
  {
    t: "늦게 온 barrier는 지나가기만",
    d: "채널 2의 barrier는 나중에 도착하지만 기다리던 연산자가 없으니 그대로 소비됩니다. 처리는 한 번도 멈추지 않았습니다. 대신 checkpoint에 in-flight 데이터가 들어가 크기가 커집니다.",
    pos: { a1: HI(Y1), a2: HI(Y1), a3: HI(Y1), bar1: HI(Y1), a4: HI(Y1), b1: HI(Y2), b2: HI(Y2), b3: HI(Y2), bar2: v(508, Y2), b4: v(455, Y2), bar3: OUT_GONE },
    op: "count = 19", sub: "", snap: "snapshot: 16 + [b2, b3]", cls: "", src: ["", ""], store: "chk-8 저장 중 · offset 3, 3 + state 16 + in-flight [b2, b3]",
  },
  {
    t: "복원하면 결과는 같다",
    d: "이 checkpoint로 복원하면 state 16에 저장해 둔 b2, b3을 다시 넣어 18이 됩니다. Aligned와 같은 결과를 정렬 대기 없이 얻습니다. backpressure가 심해 checkpoint가 타임아웃 날 때 씁니다.",
    pos: { ...consumedAll, bar3: OUT_GONE },
    op: "count = 20", sub: "", snap: "복원: 16 + [b2, b3] = 18", cls: "done", src: ["", ""], store: "chk-8 완료 = offset 3, 3 + state 16 + in-flight [b2, b3]",
  },
];
