import Section from "@/components/ui/Section";
import SectionHead from "@/components/ui/SectionHead";
import Tag from "@/components/ui/Tag";
import Code from "@/components/ui/Code";
import { card } from "@/lib/ui";
import { SINK_KINDS } from "@/lib/content";

export default function ExactlyOnceSection() {
  return (
    <Section id="exactly">
      <SectionHead eyebrow="질문 3 · 유실과 중복" title={<>Exactly-once는 &ldquo;한 번만 처리&rdquo;가 아니라 &ldquo;결과에 한 번만 반영&rdquo;</>}>
        복구하면 마지막 checkpoint 이후의 레코드는 반드시 다시 처리됩니다. 재처리 자체는 피할 수 없습니다. 재처리한 결과가 바깥에 두 번 나가지 않게 막는 것이 핵심입니다.
      </SectionHead>
      <div data-tour="eo-table" className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full border-collapse bg-surface text-[14.5px]">
          <thead>
            <tr className="bg-sunk text-left text-[13px] text-muted">
              <th className="px-4 py-3 font-semibold">보장 수준</th>
              <th className="px-4 py-3 font-semibold">장애가 나면</th>
              <th className="px-4 py-3 font-semibold">필요한 것</th>
              <th className="px-4 py-3 font-semibold">시뮬레이터</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line align-top">
            <tr>
              <td className="px-4 py-3 font-mono font-semibold whitespace-nowrap">at-most-once</td>
              <td className="px-4 py-3"><Tag tone="bad">유실 가능</Tag> 처리 중이던 데이터와 state를 잃음</td>
              <td className="px-4 py-3">checkpoint 없음</td>
              <td className="px-4 py-3">시나리오 1</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-mono font-semibold whitespace-nowrap">at-least-once</td>
              <td className="px-4 py-3"><Tag tone="warn">중복 가능</Tag> 유실은 없지만 checkpoint 이후 출력이 다시 나감</td>
              <td className="px-4 py-3">checkpoint + 되감을 수 있는 Source</td>
              <td className="px-4 py-3">시나리오 2</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-mono font-semibold whitespace-nowrap">exactly-once</td>
              <td className="px-4 py-3"><Tag tone="good">유실·중복 없음</Tag> state와 출력에 정확히 한 번 반영</td>
              <td className="px-4 py-3">위의 두 가지 + 트랜잭션 Sink 또는 멱등 Sink</td>
              <td className="px-4 py-3">시나리오 3</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div data-tour="eo-conds" className="mt-6 grid gap-3.5 lg:grid-cols-3">
        <div className={card}>
          <h3 className="mb-1.5 text-base font-semibold">1. 되감을 수 있는 Source</h3>
          <p className="text-sm text-muted">Kafka offset을 Kafka에만 맡기지 않고 Source의 state로 checkpoint에 저장합니다. 복구할 때 그 offset으로 seek하면 같은 데이터를 다시 읽을 수 있습니다.</p>
        </div>
        <div className={card}>
          <h3 className="mb-1.5 text-base font-semibold">2. 일관된 State 스냅샷</h3>
          <p className="text-sm text-muted">barrier 정렬 덕분에 offset과 연산자 state가 같은 시점을 가리킵니다. 그래서 복원하고 재처리해도 state는 정확히 한 번 반영된 값이 됩니다.</p>
        </div>
        <div className={card}>
          <h3 className="mb-1.5 text-base font-semibold">3. 트랜잭션 또는 멱등 Sink</h3>
          <p className="text-sm text-muted">
            출력은 바깥 시스템에 있어서 되돌릴 수 없습니다. checkpoint에 맞춰 커밋하는 2PC Sink를 쓰거나, 같은 key로 덮어쓰는 <Code>upsert</Code> Sink를 써서 중복이 생겨도 결과가 같게 만듭니다.
          </p>
        </div>
      </div>
      <div data-tour="eo-sinks" className="mt-8">
        <h3 className="mb-1 text-lg font-semibold">중복을 막는 두 가지 Sink</h3>
        <p className="mb-3 max-w-[75ch] text-[14.5px] text-muted">
          재처리는 피할 수 없으니, 다시 나온 결과가 바깥에 두 번 반영되지 않게 만드는 방법이 두 가지 있습니다. 이번 예제처럼 결과가 단어별 최신 개수라면 멱등 Sink로도 충분합니다.
        </p>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[760px] border-collapse bg-surface text-sm">
            <thead>
              <tr className="bg-sunk text-left text-[13px] text-muted">
                <th className="w-[160px] px-3.5 py-2.5 font-medium">방식</th>
                <th className="px-3.5 py-2.5 font-medium">어떻게</th>
                <th className="px-3.5 py-2.5 font-medium">장점</th>
                <th className="px-3.5 py-2.5 font-medium">단점</th>
                <th className="w-[170px] px-3.5 py-2.5 font-medium">예</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line align-top">
              {SINK_KINDS.map(([name, how, pro, con, ex]) => (
                <tr key={name}>
                  <td className="px-3.5 py-3 font-semibold">{name}</td>
                  <td className="px-3.5 py-3 text-muted">{how}</td>
                  <td className="px-3.5 py-3"><span className="mr-1 font-semibold text-ok">+</span>{pro}</td>
                  <td className="px-3.5 py-3"><span className="mr-1 font-semibold text-fail">−</span>{con}</td>
                  <td className="px-3.5 py-3 font-mono text-[12.5px] text-muted">{ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface p-4 text-sm">
            <b className="mb-1.5 block">append로 쓰면 (Kafka 토픽에 계속 추가)</b>
            <div className="font-mono text-[13px] text-muted">A:4 → A:5 → (장애·재처리) → A:4 → A:5</div>
            <div className="mt-1 text-fail">같은 결과가 두 번 쌓임 → 트랜잭션이 필요</div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-4 text-sm">
            <b className="mb-1.5 block">upsert로 쓰면 (key별로 덮어쓰기)</b>
            <div className="font-mono text-[13px] text-muted">A = 4 → A = 5 → (장애·재처리) → A = 4 → A = 5</div>
            <div className="mt-1 text-ok">최종 값은 A = 5 그대로 → 중복이 남지 않음</div>
          </div>
        </div>
      </div>
    </Section>
  );
}
