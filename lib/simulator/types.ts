/** tm-1(A), tm-2(B). 병렬도 2라서 subtask 번호·파티션 번호·TM이 1:1로 대응한다 */
export type Slot = "A" | "B";
export type Idx = 0 | 1;
export type Op = "source" | "count" | "sink";
export type SubId = `${Op}${Idx}`;
export type TaskState = "RUNNING" | "FAILED" | "CANCELING" | "CANCELED" | "DEPLOYING" | "INITIALIZING";
export type Key = "A" | "B";
/** Count subtask 하나가 들고 있는 key별 개수 (자기 담당 key만) */
export type Counts = Partial<Record<Key, number>>;
export type StratId = "fixed" | "exponential" | "failure-rate" | "none";
export type Level = "INFO" | "WARN" | "ERROR" | "CHAOS";
export type Guarantee = "eo" | "al";

export type Settings = { chk: boolean; guarantee: Guarantee; strat: StratId };

/**
 * 흐르는 항목.
 * - fetch: 입력 파티션 i → Source[i]
 * - shuffle: Source[from] → Count[to] (keyBy, TM을 가로지를 수 있음)
 * - fwd: Count[j] → Sink[j] (같은 TM)
 * - ack: subtask가 Checkpoint 저장소로 올리는 스냅샷 조각
 */
export type Item =
  | { k: "rec"; at: "fetch"; i: Idx; p: number; o: number; key: Key }
  | { k: "rec"; at: "shuffle"; from: Idx; to: Idx; p: number; o: number; key: Key }
  | { k: "rec"; at: "fwd"; j: Idx; p: number; o: number; part: Idx; key: Key; count: number }
  | { k: "bar"; at: "shuffle"; from: Idx; to: Idx; p: number; id: number }
  | { k: "bar"; at: "fwd"; j: Idx; p: number; id: number }
  | { k: "ack"; sub: SubId; p: number; id: number; label: string };

/** 로직 타이밍에 쓰는 메시지: JM → Source checkpoint 시작, JM → Sink commit, Sink → 출력 토픽 쓰기 */
export type Fx =
  | { k: "trigger"; i: Idx; p: number; id: number }
  | { k: "commit"; j: Idx; p: number; id: number }
  | { k: "write"; j: Idx; p: number; key: Key; count: number };

/** 출력 레코드. j=출력 파티션(Sink 번호), part·o=원래 입력 파티션과 offset */
export type OutRec = {
  j: Idx;
  part: Idx;
  o: number;
  key: Key;
  count: number;
  st: "new" | "ok" | "pending" | "pre" | "aborted";
  txn: number;
  dup: boolean;
};

/** 복구 단계. step은 화면의 "복구 단계" 목록 번호와 같다. */
export type Phase = { step: 1 | 2 | 3 | 4 | 5 | 6; left: number; total: number; delay?: number };

/** 자동 장애 주입. align이면 Count가 barrier를 기다리는 순간을 노린다 */
export type AutoKill = { kills: number; wait: number; between: number; slot: Slot; align?: boolean };

/** Count[j]의 barrier 정렬 상태: 어느 입력 채널에서 barrier를 받았는지 */
export type Align = { id: number | null; got: [boolean, boolean] };

/** 출력 버퍼 항목: 내보낼 Item과 버퍼에 머문 시간 */
export type BufEntry = { it: Item; age: number };

export type Snapshot = { id: number; offsets: [number, number]; counts: [Counts, Counts] };

export type SimState = {
  t: number;
  logEnd: [number, number];
  pos: [number, number];
  counts: [Counts, Counts];
  /** countPos[j][i]: Count[j]가 입력 파티션 i에서 처리한 다음 offset */
  countPos: [[number, number], [number, number]];
  items: Item[];
  fx: Fx[];
  /**
   * Source[i]의 출력 네트워크 버퍼: outBuf[i][to]는 Count[to]로 보낼 항목 큐.
   * 레코드와 barrier가 여기 순서대로 쌓였다가 하나씩 네트워크(shuffle 채널)로 나간다.
   */
  outBuf: [[BufEntry[], BufEntry[]], [BufEntry[], BufEntry[]]];
  /** 버퍼마다 마지막으로 보낸 뒤 지난 시간 */
  sendAcc: [[number, number], [number, number]];
  /** 정렬 중 막힌 채널에 도착해 기다리는 레코드: queue[j][i] */
  queue: [[Item[], Item[]], [Item[], Item[]]];
  align: [Align, Align];
  output: OutRec[];
  /** "파티션:offset"으로 커밋된 입력 */
  committed: Set<string>;
  lost: Set<string>;
  dup: number;
  committedN: number;
  nextChk: number;
  inProg: {
    id: number;
    offsets: [number | null, number | null];
    counts: [Counts | null, Counts | null];
    acks: number;
    done: SubId[];
  } | null;
  last: Snapshot | null;
  /** 장애로 폐기된 checkpoint (잠깐 화면에 표시) */
  failedChk: { id: number; until: number } | null;
  sinkTxn: [number, number];
  acc: { prod: [number, number]; read: [number, number]; chk: number };
  tms: Record<Slot, { name: string; st: "alive" | "dead" | "new" }>;
  tmSeq: number;
  task: Record<SubId, TaskState>;
  flash: Record<SubId, number>;
  /** Source 안에서 barrier가 생겨나는 장면 타이머 */
  inject: [number, number];
  job: "RUNNING" | "FAILED";
  phase: Phase | null;
  recovered: boolean;
  restarts: number;
  failTimes: number[];
  expStep: number;
  lastFail: number;
  deadSlot: Slot | null;
  log: { t: number; lvl: Level; src: string; msg: string }[];
  auto: AutoKill | null;
  /** 단계별 모드가 "다음 장면"을 알아채는 데 쓰는 이벤트 기록. seq는 계속 늘어난다 */
  ev: { seq: number; type: SimEvent; i?: number }[];
  evSeq: number;
};

export type SimEvent =
  | "write" | "trigger" | "inject" | "align-wait" | "align-done" | "complete" | "commit"
  | "kill" | "detect" | "decide" | "deploy" | "restore" | "running" | "job-failed";
