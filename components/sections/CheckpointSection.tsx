import Section from "@/components/ui/Section";
import SectionHead from "@/components/ui/SectionHead";
import { card } from "@/lib/ui";
import BarrierStepper from "@/components/checkpoint/BarrierStepper";
import CheckpointAnatomy from "@/components/checkpoint/CheckpointAnatomy";
import Code from "@/components/ui/Code";
import { BARRIER_MODES } from "@/lib/content";

export default function CheckpointSection() {
  return (
    <Section id="checkpoint">
      <SectionHead eyebrow="질문 2 · Checkpoint" title="Barrier가 지나간 자리에서 찍는 스냅샷">
        checkpoint 하나에는 Source가 어디까지 읽었는지(offset)와 연산자가 지금까지 계산한 값(state), Sink의 트랜잭션이 함께 들어갑니다. 셋 다 같은 barrier를 기준으로 찍히기 때문에 같은 시점을 가리킵니다.
      </SectionHead>
      <div data-tour="cp-anatomy">
        <h3 className="mb-3 text-lg font-semibold">checkpoint에 들어가는 것</h3>
        <CheckpointAnatomy />
      </div>
      <h3 className="mt-10 mb-1 text-lg font-semibold">입력이 두 개면: barrier 정렬</h3>
      <p className="mb-4 max-w-[65ch] text-[14.5px] text-muted">
        Job을 멈추지 않고 일관된 스냅샷을 찍는 방법입니다(Chandy-Lamport 알고리즘의 변형). 두 채널의 barrier가 모두 도착한 순간의 state를 저장합니다.
      </p>
      <BarrierStepper />
      <div data-tour="cp-compare" className="mt-6">
        <h3 className="mb-3 text-lg font-semibold">Aligned와 Unaligned, 무엇을 고르나</h3>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[760px] border-collapse bg-surface text-sm">
            <thead>
              <tr className="bg-sunk text-left text-[13px] text-muted">
                <th className="w-[140px] px-3.5 py-2.5 font-medium">방식</th>
                <th className="px-3.5 py-2.5 font-medium">동작</th>
                <th className="px-3.5 py-2.5 font-medium">장점</th>
                <th className="px-3.5 py-2.5 font-medium">단점</th>
                <th className="w-[170px] px-3.5 py-2.5 font-medium">이럴 때</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line align-top">
              {BARRIER_MODES.map(([name, how, pro, con, when]) => (
                <tr key={name}>
                  <td className="px-3.5 py-3 font-semibold">{name}</td>
                  <td className="px-3.5 py-3 text-muted">{how}</td>
                  <td className="px-3.5 py-3"><span className="mr-1 font-semibold text-ok">+</span>{pro}</td>
                  <td className="px-3.5 py-3"><span className="mr-1 font-semibold text-fail">−</span>{con}</td>
                  <td className="px-3.5 py-3 text-muted">{when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2.5 max-w-[80ch] text-[13.5px] text-muted">
          둘을 섞을 수도 있습니다. <Code>execution.checkpointing.aligned-checkpoint-timeout</Code>을 주면 평소에는 aligned로 찍다가, 정렬이 그 시간을 넘기면 그 checkpoint만 unaligned로 바꿉니다. 평소에는 작은 checkpoint를 유지하고 backpressure 때만 unaligned의 이점을 씁니다.
        </p>
      </div>
      <div data-tour="cp-cards" className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className={card}>
          <h3 className="mb-2 text-lg font-semibold">State Backend와 저장소</h3>
          <p className="text-[14.5px] text-muted">
            <b className="text-ink">HashMap</b>: state를 JVM 힙에 둡니다. 빠르지만 메모리 크기에 묶입니다. <b className="text-ink">EmbeddedRocksDB</b>: 로컬 디스크에 두고, 바뀐 파일만 올리는 incremental checkpoint를 지원해 큰 state에 맞습니다. 스냅샷은 S3나 HDFS 같은 내구성 있는 저장소에 비동기로 올라가므로 처리가 멈추지 않습니다.
          </p>
        </div>
        <div className={card}>
          <h3 className="mb-2 text-lg font-semibold">Checkpoint와 Savepoint</h3>
          <p className="text-[14.5px] text-muted">
            <b className="text-ink">Checkpoint</b>는 Flink가 장애 복구용으로 자동으로 찍고 관리합니다. <b className="text-ink">Savepoint</b>는 사람이 직접 찍는 이식 가능한 스냅샷이라 버전 업그레이드, 병렬도 변경, 코드 배포에 씁니다. 원리는 같고 소유권과 포맷이 다릅니다.
          </p>
        </div>
      </div>
    </Section>
  );
}
