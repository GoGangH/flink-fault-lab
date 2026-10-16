import Section from "@/components/ui/Section";
import SectionHead from "@/components/ui/SectionHead";
import Code from "@/components/ui/Code";
import { card, pre } from "@/lib/ui";
import { KAFKA_SINK } from "@/lib/content";

export default function TwoPhaseCommitSection() {
  return (
    <Section id="twopc">
      <SectionHead eyebrow="질문 3 · Two-Phase Commit" title="트랜잭션 Sink는 checkpoint에 맞춰 커밋한다" />
      <div data-tour="tpc-flow" className="grid overflow-hidden rounded-lg border border-line bg-surface sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["border-t-pending", "beginTransaction", "트랜잭션 열기", "checkpoint 사이의 출력을 하나의 Kafka 트랜잭션에 씁니다. 커밋 전이라 read_committed consumer에게는 보이지 않습니다."],
          ["border-t-barrier", "preCommit", "barrier 도착", "Sink에 barrier가 오면 flush하고 트랜잭션을 준비 상태로 둡니다. 다음 트랜잭션을 엽니다."],
          ["border-t-barrier", "snapshotState", "모든 Task ack", "JobManager가 모든 Task의 스냅샷을 받으면 checkpoint 완료. 준비된 트랜잭션 정보도 state에 들어 있습니다."],
          ["border-t-ok", "commit", "notifyCheckpointComplete", "완료 알림을 받은 Sink가 트랜잭션을 커밋합니다. 이때 비로소 출력이 보입니다."],
        ].map(([b, code, t, d]) => (
          <div key={code} className={"border-t-[3px] border-line p-4 text-sm [&:not(:first-child)]:border-l " + b}>
            <code className="mb-1.5 block font-mono text-xs text-rec">{code}</code>
            <b className="mb-1 block text-[14.5px]">{t}</b>
            <span className="text-[13.5px] text-muted">{d}</span>
          </div>
        ))}
      </div>
      <div data-tour="tpc-fail" className="mt-2.5 rounded-lg border border-fail bg-fail-tint px-4 py-3.5 text-sm">
        <b className="text-fail">checkpoint 완료 전에 장애가 나면</b> 열려 있던 트랜잭션은 abort됩니다. Job은 직전 checkpoint로 되돌아가 그 이후를 다시 처리하고, 새 트랜잭션에 씁니다. 바깥에는 한 번만 커밋되므로 중복이 없습니다. 반대로 checkpoint는 완료됐는데 commit 직전에 죽었다면, 복구할 때 state에 남아 있는 트랜잭션을 다시 커밋합니다.
      </div>
      <pre data-tour="tpc-code" className={pre + " mt-6"}>
        <code>{KAFKA_SINK}</code>
      </pre>
      <div data-tour="tpc-traps" className="mt-6 grid gap-3.5 sm:grid-cols-2">
        {[
          ["트랜잭션 타임아웃이 짧으면 유실", <>트랜잭션은 checkpoint가 끝나야 커밋됩니다. <Code>transaction.timeout.ms</Code>가 &ldquo;checkpoint 간격 + 복구 시간&rdquo;보다 짧으면 broker가 먼저 abort해 버려 데이터가 사라집니다. broker의 <Code>transaction.max.timeout.ms</Code>(기본 15분)도 함께 확인해야 합니다.</>],
          ["consumer가 read_uncommitted면 중복처럼 보임", <>abort된 레코드까지 읽기 때문입니다. exactly-once 파이프라인의 다운스트림은 반드시 <Code>read_committed</Code>로 읽어야 합니다.</>],
          ["출력 지연 = checkpoint 간격", <>커밋이 checkpoint 완료에 묶여 있어서, 간격이 1분이면 결과도 최대 1분 늦게 보입니다. 지연과 복구 비용 사이의 트레이드오프입니다.</>],
          ["비결정적 로직은 재처리 결과가 달라짐", <>처리 시각, 랜덤 값, 외부 API 조회에 의존하면 다시 처리했을 때 다른 값이 나옵니다. event time과 결정적 로직을 써야 합니다.</>],
        ].map(([t, d]) => (
          <div key={t as string} className={card + " text-sm"}>
            <b className="mb-1 block text-[15px]">{t}</b>
            <span className="text-muted">{d}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
