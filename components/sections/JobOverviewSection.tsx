import Section from "@/components/ui/Section";
import SectionHead from "@/components/ui/SectionHead";
import Tag from "@/components/ui/Tag";
import PipelineFlow from "@/components/prereq/PipelineFlow";
import { SCENARIOS, SYMBOLS } from "@/lib/content";

export default function JobOverviewSection() {
  return (
    <Section id="job">
      <SectionHead eyebrow="사전 지식 4 · 예제 Job" title="단어를 세는 Job 하나로 실험합니다">
        orders 토픽의 단어를 읽어 key별로 개수를 세고, 그 결과를 다른 Kafka 토픽(word-counts)에 씁니다. 결과를 DB 대신 토픽에 두면 다른 서비스가 그 토픽을 구독해서 읽어 갑니다. 아래는 흐름만 보이도록 한 벌로 그렸고, 시뮬레이터에서는 병렬도 2로 두 벌이 돕니다.
      </SectionHead>

      <div data-tour="job-flow">
        <PipelineFlow />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div data-tour="job-scenarios" className="min-w-0">
          <h3 className="mb-3 text-lg font-semibold">시뮬레이터 시나리오</h3>
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full border-collapse bg-surface text-sm">
              <thead>
                <tr className="bg-sunk text-left text-[13px] text-muted">
                  <th className="px-3.5 py-2.5 font-medium">시나리오</th>
                  <th className="px-3.5 py-2.5 font-medium">설정</th>
                  <th className="px-3.5 py-2.5 font-medium">확인할 것</th>
                  <th className="px-3.5 py-2.5 font-medium">결과</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line align-top">
                {SCENARIOS.map(([n, set, look, tone, res]) => (
                  <tr key={n}>
                    <td className="px-3.5 py-2.5 font-semibold whitespace-nowrap">{n}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[12.5px] whitespace-nowrap">{set}</td>
                    <td className="px-3.5 py-2.5 text-muted">{look}</td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap"><Tag tone={tone as "bad" | "warn" | "good"}>{res}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div data-tour="job-symbols">
          <h3 className="mb-3 text-lg font-semibold">화면 기호</h3>
          <ul className="grid gap-2.5 text-sm">
            {SYMBOLS.map(([shape, t, d]) => (
              <li key={t} className="grid grid-cols-[28px_1fr] items-start gap-3">
                <span className="mt-0.5 flex h-5 items-center justify-center">
                  <i className={shape} />
                </span>
                <span>
                  <b className="font-semibold">{t}</b> <span className="text-muted">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
