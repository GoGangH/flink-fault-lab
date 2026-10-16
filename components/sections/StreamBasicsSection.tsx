import Section from "@/components/ui/Section";
import SectionHead from "@/components/ui/SectionHead";
import KeyedStateDemo from "@/components/prereq/KeyedStateDemo";
import { GLOSSARY } from "@/lib/content";

const POINTS = [
  ["끝이 없는 데이터", "배치처럼 \"처음부터 다시 돌리면 된다\"가 통하지 않습니다. 장애가 나도 멈췄던 지점부터 이어 가야 합니다."],
  ["연산자와 병렬 Task", "Source → 변환 → Sink로 이어진 연산자마다 병렬도만큼 Task가 생기고, Task가 TaskManager의 slot에서 돕니다."],
  ["Task가 들고 있는 State", "keyBy로 같은 key는 항상 같은 Task에 모입니다. Task는 key별 값(개수, 합계, 윈도우 등)을 자기 메모리나 로컬 디스크에 둡니다."],
];

export default function StreamBasicsSection() {
  return (
    <Section id="stream">
      <SectionHead eyebrow="사전 지식 1 · 스트림 처리" title="State는 TaskManager 안에 있다">
        장애 복구가 어려운 이유는 하나입니다. Flink의 연산 결과가 Task의 메모리에 쌓이기 때문입니다.
      </SectionHead>
      <div data-tour="stream-points" className="mb-8 grid gap-x-8 gap-y-5 lg:grid-cols-3">
        {POINTS.map(([t, d]) => (
          <div key={t} className="border-t-2 border-ink pt-3">
            <h3 className="mb-1.5 text-base font-semibold">{t}</h3>
            <p className="text-sm text-muted">{d}</p>
          </div>
        ))}
      </div>
      <div data-tour="stream-demo">
        <KeyedStateDemo />
      </div>
      <div data-tour="stream-glossary" className="mt-6">
        <h3 className="mb-2 text-base font-semibold">이후에 나오는 용어</h3>
        <dl className="grid gap-x-6 gap-y-1 rounded-lg border border-line bg-surface px-5 py-3 text-sm sm:grid-cols-2">
          {GLOSSARY.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[110px_1fr] gap-3 border-b border-line py-2 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
              <dt className="font-mono text-[13px] font-semibold">{k}</dt>
              <dd className="text-muted">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}
