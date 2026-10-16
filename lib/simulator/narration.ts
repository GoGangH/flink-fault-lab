import { IDX } from "./constants";
import type { SimEngine } from "./engine";

export type Tone = "ok" | "warn" | "bad";

/** 시뮬레이터 상단 상황 줄: 지금 화면에서 무슨 일이 일어나는지 한 문장으로 말한다 */
export function narrate(eng: SimEngine): [Tone, string] {
  const { S, settings } = eng;
  if (S.job === "FAILED") return ["bad", `Restart Strategy(${settings.strat})가 재시작을 거부했습니다. Job이 FAILED 상태로 끝났습니다.`];

  if (S.phase) {
    const d = S.tms[S.deadSlot!].name;
    switch (S.phase.step) {
      case 1: return ["bad", `${d}가 죽었습니다. 그 위의 Source·Count·Sink와 전송 중이던 레코드가 사라졌습니다. JobManager는 아직 모릅니다.`];
      case 2: return ["bad", `JobManager가 ${d}의 heartbeat를 기다리는 중입니다. 타임아웃이 지나야 장애로 판정합니다.`];
      case 3:
        return ["warn", S.failedChk
          ? `장애 확정. 진행 중이던 chk-${S.failedChk.id}는 끝까지 못 모았으니 폐기합니다. 살아 있는 TM의 Task까지 6개를 모두 취소합니다.`
          : "장애 확정. keyBy로 모두 연결돼 있어 Job 전체가 한 region입니다. 살아 있는 TM의 Task까지 6개를 모두 취소합니다."];
      case 4: return ["warn", `Restart Strategy가 재시작을 허락했습니다. ${S.phase.delay}초 기다린 뒤 다시 띄웁니다.`];
      case 5: return ["warn", "ResourceManager가 새 TaskManager를 받아 Task 6개를 배포합니다. 그동안에도 입력 파티션에는 데이터가 쌓입니다."];
      case 6:
        return settings.chk && S.last
          ? ["warn", `chk-${S.last.id}로 복원합니다. 두 Source는 저장된 offset(${S.last.offsets.join(", ")})으로 되감고, Count는 저장된 state로 돌아갑니다.`]
          : ["warn", "복원할 checkpoint가 없습니다. 빈 state로 시작하고 Source는 최신 offset부터 읽습니다."];
    }
  }

  // 정상 실행 중: checkpoint 진행 단계별 설명
  const p = S.inProg;
  const waiting = IDX.find((j) => eng.blockedChannel(j) != null);
  if (waiting != null) {
    const b = eng.blockedChannel(waiting)!;
    return ["warn", `정렬 대기: KeyedCount[${waiting}]는 Source[${b}]의 barrier를 먼저 받았습니다. Source[${b === 0 ? 1 : 0}]의 barrier가 올 때까지 그 채널을 막고 레코드를 줄 세워 둡니다.`];
  }
  if (p && S.fx.some((f) => f.k === "trigger")) return ["ok", `JobManager가 두 Source에 chk-${p.id} 시작을 요청했습니다. 요청을 받은 Source가 barrier를 스트림에 끼워 넣습니다.`];
  if (p) return ["ok", `barrier가 지나간 subtask가 그 순간의 state를 저장소 자기 칸에 올리는 중입니다 (${p.acks}/6).`];
  if (S.fx.some((f) => f.k === "commit"))
    return ["ok", eng.eo
      ? "6개 파일이 다 모여 JobManager가 _metadata를 쓰고 checkpoint를 완료했습니다. 이제 Sink에 완료를 알리고, 알림을 받은 Sink가 트랜잭션을 commit하면 미커밋 출력이 확정됩니다."
      : "6개 파일이 다 모여 checkpoint를 완료했습니다. JobManager가 Sink에 완료를 알리지만, at-least-once Sink는 트랜잭션이 없어 할 일이 없습니다(출력은 이미 공개됨)."];

  if (S.recovered) {
    const lag = Math.max(S.logEnd[0] - S.pos[0], S.logEnd[1] - S.pos[1]);
    if (lag > 1) return ["warn", `복구 완료. 밀린 레코드를 따라잡는 중입니다 (checkpoint 이후 구간 재처리 포함, 최대 lag ${lag}).`];
    if (S.lost.size) return ["bad", `복구는 됐지만 레코드 ${S.lost.size}개가 유실됐고 state도 틀렸습니다. checkpoint가 없었기 때문입니다.`];
    if (S.dup) return ["bad", `복구 완료. state는 정확하지만 출력에 중복 ${S.dup}건이 생겼습니다. at-least-once Sink가 재처리 결과를 그대로 썼기 때문입니다.`];
    return ["ok", "복구 완료. 커밋 안 된 트랜잭션은 버리고 재처리 결과만 커밋했습니다. 유실 0, 중복 0."];
  }
  if (!settings.chk) return ["warn", "정상 처리 중. checkpoint가 꺼져 있어서 지금 장애가 나면 state를 되살릴 수 없습니다."];
  return ["ok", `정상 처리 중. 두 Source가 각자 파티션을 읽고, keyBy로 A는 Count[0], B는 Count[1]로 갑니다.${eng.eo ? " Sink는 checkpoint가 완료될 때 커밋합니다." : " Sink는 받는 즉시 씁니다."}`];
}
