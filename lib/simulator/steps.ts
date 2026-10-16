import { IDX } from "./constants";
import type { SimEngine } from "./engine";
import type { Slot } from "./types";

/**
 * 단계별 모드 대본. 각 단계는 "다음"을 누르면 시작해서 until이 참이 될 때까지 시뮬레이션을 돌린 뒤 멈춘다.
 * since는 그 단계가 시작될 때의 이벤트 번호다.
 */
export type Step = {
  title: string;
  desc: (e: SimEngine) => string;
  until: (e: SimEngine, since: number) => boolean;
  /** 단계 시작 때 할 일 (장애 주입 등) */
  act?: (e: SimEngine) => void;
  /** 조건을 만족한 뒤 더 돌리는 시간(초). 기본 0: 장면이 일어난 바로 그 순간, 다음 움직임 전에 멈춘다 */
  settle?: number;
  /** now: 단계 시작 때 checkpoint를 건다, auto: 이 단계 동안 주기적 checkpoint를 켠다. 없으면 checkpoint를 걸지 않는다 */
  chk?: "now" | "auto";
};

const name = (e: SimEngine, s: Slot) => e.S.tms[s].name;
const lagged = (e: SimEngine) => IDX.some((i) => e.S.logEnd[i] - e.S.pos[i] > 1);
const chk = (e: SimEngine) => e.S.inProg?.id ?? e.S.last?.id ?? e.S.nextChk;

const flow: Step = {
  title: "데이터가 흐릅니다",
  desc: () =>
    "Producer가 두 파티션에 단어를 계속 씁니다. Source[0]·Source[1]는 각자 읽는 위치에서 하나씩 가져가고, keyBy로 A는 Count[0], B는 Count[1]로 보냅니다. Count가 센 결과를 Sink가 출력 토픽에 씁니다.",
  until: (e, s) => e.seen(s, "write") >= 2,
};

const trigger: Step = {
  chk: "now",
  title: "JobManager가 checkpoint를 요청합니다",
  desc: (e) =>
    `CheckpointCoordinator가 두 Source에 chk-${chk(e)} 시작을 보냈습니다. 요청을 받은 Source는 TM 메모리에 들고 있던 자기 state(지금까지 읽은 offset)를 스냅샷 떠서 저장소에 올리고, barrier(노란 점 ${chk(e)})를 출력 버퍼의 두 칸(Count[0]용, Count[1]용) 맨 뒤에 하나씩 넣습니다. 이미 쌓인 레코드가 먼저 나가고, 그 뒤에 barrier가 나갑니다.`,
  until: (e) => !!e.S.inProg && e.S.inProg.offsets.every((o) => o != null),
};

const alignWait: Step = {
  title: "barrier 정렬 대기",
  desc: (e) => {
    const j = IDX.find((x) => e.blockedChannel(x) != null) ?? 0;
    const b = e.blockedChannel(j) ?? 0;
    return `KeyedCount[${j}]는 Source[${b}]의 barrier를 먼저 받았습니다. Source[${b === 0 ? 1 : 0}]의 barrier가 아직 안 왔기 때문에, 먼저 온 채널은 '차단'하고 그 뒤로 오는 레코드를 줄 세워 둡니다. 지금 state를 찍으면 barrier 뒤의 데이터가 섞이기 때문입니다.`;
  },
  until: (e) => IDX.some((j) => e.blockedChannel(j) != null),
};

const alignDone: Step = {
  title: "정렬 완료 → state 저장",
  desc: () =>
    "두 Count 모두 양쪽 barrier를 받았습니다. TM 메모리에 있던 state(key별 개수)를 바로 그 순간 스냅샷 떠서 저장소에 올리고, barrier를 Sink로 내려보낸 뒤 막아 두었던 레코드를 처리합니다. 원본 state는 계속 메모리에서 갱신됩니다.",
  until: (e) => !e.S.inProg || e.S.inProg.counts.every((c) => c != null),
};

const complete: Step = {
  title: "checkpoint 완료",
  desc: (e) =>
    `Sink까지 barrier가 지나가 6개 subtask의 state 복사본이 모두 저장소에 올라왔습니다. 파일은 subtask마다 barrier가 지나간 시점에 하나씩 따로 올라왔고, 그때까지는 미확정이었습니다. 6개가 다 모이자 JobManager가 _metadata를 써서 chk-${e.S.last?.id}를 한 번에 확정했습니다. 이제 TM이 죽어 메모리의 state가 사라져도 이 복사본으로 되돌릴 수 있습니다.`,
  until: (e, s) => e.seen(s, "complete") >= 1,
};

const commit: Step = {
  title: "완료 알림 → Sink의 반응",
  desc: (e) =>
    e.eo
      ? "JobManager가 두 Sink에 완료를 알렸고, 알림을 받은 Sink가 트랜잭션을 commit했습니다. 보라 점선이던 출력이 초록으로 확정되어, 이제 read_committed consumer가 읽을 수 있습니다."
      : "JobManager가 두 Sink에 완료를 알렸지만, at-least-once Sink는 트랜잭션이 없어 할 일이 없습니다. 출력은 쓰는 순간 이미 초록(공개)이었습니다. 그래서 checkpoint 이후에 내보낸 출력은 나중에 되돌릴 방법이 없습니다.",
  until: (e, s) => e.seen(s, "commit") >= 2,
};

const afterCheckpoint: Step = {
  title: "checkpoint 이후에도 처리는 계속됩니다",
  desc: (e) =>
    e.eo
      ? "checkpoint 뒤에 나온 결과는 다음 트랜잭션에 들어가 아직 미커밋(보라 점선)입니다. 다음 checkpoint가 완료되어야 확정됩니다."
      : e.settings.chk
        ? "at-least-once Sink는 받는 즉시 확정해서 씁니다(초록). checkpoint와 상관없이 바로 바깥에 나갑니다."
        : "checkpoint가 꺼져 있어 저장소에는 아무것도 없습니다. Sink는 받는 즉시 씁니다.",
  until: (e, s) => e.seen(s, "write") >= 4,
};

function failure(slot: Slot): Step[] {
  return [
    {
      title: "TaskManager 장애",
      act: (e) => e.kill(slot),
      desc: (e) =>
        `${name(e, slot)}이 죽었습니다. 그 위의 Source, Count, Sink와 함께 TM 메모리에 있던 state, 전송 중이던 레코드가 사라졌습니다. JobManager는 아직 이 사실을 모릅니다.`,
      until: (e, s) => e.seen(s, "kill") >= 1,
    },
    {
      title: "장애 감지",
      desc: (e) =>
        "heartbeat가 끊기고 타임아웃이 지나 JobManager가 장애로 판정했습니다." +
        (e.S.failedChk ? ` 진행 중이던 chk-${e.S.failedChk.id}는 6개 파일을 다 못 모았으니 무효로 폐기합니다.` : ""),
      until: (e, s) => e.seen(s, "detect") >= 1,
    },
    {
      title: "Task 취소 · 재시작 판단",
      desc: (e) =>
        e.S.job === "FAILED"
          ? `Restart Strategy(${e.settings.strat})가 재시작을 거부해 Job이 FAILED로 끝났습니다.`
          : `keyBy로 모든 subtask가 연결된 한 region이라, 살아 있는 TM의 Task까지 6개를 모두 취소했습니다. Restart Strategy가 ${e.S.phase?.delay ?? 0}초 뒤 재시작을 허락했습니다.`,
      until: (e, s) => e.seen(s, "decide") >= 1 || e.seen(s, "job-failed") >= 1,
    },
    {
      title: "새 TaskManager에 재배포",
      desc: (e) => `ResourceManager가 새 TaskManager(${name(e, slot)})를 받아 6개 Task를 다시 배포합니다. 그동안에도 Producer는 계속 쓰고 있어 입력이 밀립니다.`,
      until: (e, s) => e.seen(s, "deploy") >= 1,
    },
    {
      title: "state 복원",
      desc: (e) => {
        const L = e.S.last;
        if (!e.settings.chk || !L) return "복원할 checkpoint가 없습니다. Count는 빈 state로 시작하고, Source는 최신 offset부터 읽어서 그사이 레코드를 건너뜁니다. 입력 토픽의 빨간 칸이 유실된 레코드입니다.";
        return `새 TM들이 저장소에서 chk-${L.id}의 state 복사본을 읽어 메모리에 다시 올립니다. Source는 저장된 offset(${L.offsets.join(", ")})부터 다시 읽고, Count는 저장된 개수로 돌아갑니다.` + (e.eo ? " 커밋 안 된 트랜잭션은 abort합니다(회색)." : "");
      },
      until: (e, s) => e.seen(s, "restore") >= 1,
    },
    {
      title: "재처리와 결과",
      desc: (e) => {
        const S = e.S;
        if (S.lost.size) return `처리는 다시 돌지만 레코드 ${S.lost.size}개가 유실됐고 state도 정답과 다릅니다. checkpoint가 없으면 돌아갈 곳이 없습니다.`;
        if (S.dup) return `checkpoint 이후 구간을 다시 처리했습니다. state는 정확하지만, at-least-once Sink가 이미 썼던 결과를 또 써서 출력에 중복 ${S.dup}건이 생겼습니다.`;
        return "checkpoint 이후 구간을 다시 처리해 새 트랜잭션에 썼습니다. abort된 출력은 consumer에게 보이지 않으니 유실 0, 중복 0입니다.";
      },
      // exactly-once는 재처리 결과의 commit까지 보여 줘야 해서 checkpoint를 다시 켠다. 나머지는 결과 화면이 섞이지 않게 끈다
      act: (e) => { if (e.eo) e.manualChk = false; },
      until: (e, s) => e.seen(s, "running") >= 1 && !lagged(e) && e.seen(s, "write") >= 3 && (!e.eo || e.seen(s, "commit") >= 2),
    },
  ];
}

const normalCycle = [flow, trigger, alignWait, alignDone, complete, commit];

/** 정렬 중 장애: 감지 이후 장면을 이 상황에 맞는 설명으로 바꾼다 */
function alignFailureRest(): Step[] {
  const [detect, cancel, deploy, restore, result] = failure("B").slice(1);
  return [
    {
      ...detect,
      desc: (e) =>
        `JobManager가 tm-2의 장애를 감지했습니다. chk-${e.S.failedChk?.id ?? ""}는 6개 중 일부만 올라온 채 끝날 수 없으니 실패로 처리하고, _metadata 없이 올라와 있던 파일은 무효라 버립니다.`,
    },
    {
      ...cancel,
      title: "살아 있는 tm-1의 Task도 취소",
      desc: (e) =>
        e.S.job === "FAILED"
          ? cancel.desc(e)
          : "tm-1은 멀쩡하지만, keyBy로 모든 Task가 연결된 한 region이라 tm-1의 Task 3개도 함께 취소합니다. 이때 Count[0]의 barrier 대기 상태, 막아 두었던 레코드, 메모리에 있던 chk-1 이후의 최신 state가 모두 버려집니다. tm-1 프로세스 자체는 죽이지 않습니다.",
    },
    {
      ...deploy,
      desc: () => "tm-1 프로세스는 재시작하지 않고, 같은 slot에 Task만 다시 배포합니다. 죽은 tm-2 자리에는 ResourceManager가 새 TaskManager(tm-3)를 받아 와 배포합니다. Job은 전부 재시작하지만, TM이 바뀌는 건 죽은 쪽뿐입니다.",
    },
    {
      ...restore,
      title: "6개 모두 chk-1로 함께 복원",
      desc: (e) => {
        const L = e.S.last;
        return `tm-2 쪽만이 아니라 6개 Task 모두 chk-${L?.id}의 state를 저장소에서 읽어 메모리에 올립니다. Source는 offset(${L?.offsets.join(", ")})부터 다시 읽습니다. 한쪽만 되돌리면 Count[0]이 이미 센 레코드를 Source[1]이 다시 보내 중복으로 세거나, 날아간 레코드를 놓치기 때문입니다.`;
      },
    },
    result,
  ];
}

export const STEP_SCRIPTS: Record<string, Step[]> = {
  normal: normalCycle,
  loss: [flow, afterCheckpoint, ...failure("A")],
  dup: [flow, trigger, alignWait, alignDone, complete, commit, afterCheckpoint, ...failure("A")],
  eo: [...normalCycle, afterCheckpoint, ...failure("A")],
  align: [
    flow,
    { ...complete, chk: "now", title: "첫 checkpoint 완료", until: (e, s) => e.seen(s, "commit") >= 2 },
    { ...trigger, title: "다음 checkpoint 요청" },
    alignWait,
    {
      ...failure("B")[0],
      title: "정렬을 기다리는 중에 tm-2 장애",
      desc: (e) =>
        `Count[0]이 기다리던 barrier는 tm-2의 Source[1]가 보낼 예정이었습니다. ${name(e, "B")}가 죽었으니 그 barrier는 영영 오지 않고, 이번 checkpoint는 끝까지 모일 수 없습니다.`,
    },
    ...alignFailureRest(),
  ],
  giveup: [
    flow,
    { ...complete, chk: "now", until: (e, s) => e.seen(s, "complete") >= 1 },
    ...[1, 2, 3].map(
      (n): Step => ({
        title: `${n}번째 장애 → 재시작`,
        act: (e) => e.kill("A"),
        desc: (e) => `${n}번째 장애입니다. fixed-delay는 최대 3번까지 재시작합니다. 지금까지 재시작 ${e.S.restarts}번.`,
        until: (e, s) => e.seen(s, "running") >= 1,
      }),
    ),
    {
      title: "4번째 장애 → 포기",
      act: (e) => e.kill("A"),
      desc: () => "재시작 횟수를 다 써서 Restart Strategy가 재시작을 거부했습니다. Job은 FAILED로 끝나고, 사람이 원인을 고쳐 다시 제출해야 합니다.",
      until: (e, s) => e.seen(s, "job-failed") >= 1,
    },
  ],
};
