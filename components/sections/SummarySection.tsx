import Section from "@/components/ui/Section";
import SectionHead from "@/components/ui/SectionHead";
import Code from "@/components/ui/Code";
import { card, note } from "@/lib/ui";
import { CHEAT } from "@/lib/content";

export default function SummarySection() {
  return (
    <Section id="wrap">
      <SectionHead eyebrow="정리" title="세 질문에 대한 답" />
      <div data-tour="wrap-recap" className="grid gap-3.5 lg:grid-cols-3">
        {[
          ["질문 1 · 복구 과정", "heartbeat로 장애를 감지하고, region 단위로 Task를 취소하고, Restart Strategy가 허락하면 새 slot에 재배포합니다."],
          ["질문 2 · 기준점", "마지막으로 완료된 checkpoint입니다. Source offset과 연산자 state가 같은 시점으로 함께 되돌아갑니다."],
          ["질문 3 · 유실과 중복", "checkpoint와 되감을 수 있는 Source로 유실을 막고, 트랜잭션이나 멱등 Sink로 재처리에 따른 중복을 막습니다."],
        ].map(([t, d]) => (
          <div key={t} className={card}>
            <b className="mb-1.5 block font-mono text-xs text-muted">{t}</b>
            <p className="text-[15px]">{d}</p>
          </div>
        ))}
      </div>
      <h3 className="mt-10 mb-3 text-lg font-semibold">핵심 설정</h3>
      <div data-tour="wrap-cheat" className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full border-collapse bg-surface text-sm">
          <thead>
            <tr className="bg-sunk text-left text-[13px] text-muted">
              <th className="px-3.5 py-2.5 font-semibold">설정 키</th>
              <th className="px-3.5 py-2.5 font-semibold">예시 값</th>
              <th className="px-3.5 py-2.5 font-semibold">의미</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line align-top">
            {CHEAT.map(([k, v, d]) => (
              <tr key={k}>
                <td className="px-3.5 py-2.5 font-mono text-[13px] whitespace-nowrap">{k}</td>
                <td className="px-3.5 py-2.5 font-mono text-[13px] whitespace-nowrap text-rec">{v}</td>
                <td className="px-3.5 py-2.5">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={note}>
        키 이름은 Flink 1.20 / 2.x 기준입니다. 이전 버전은 <Code>state.backend.incremental</Code>, <Code>state.checkpoints.dir</Code>처럼 이름이 다릅니다.
      </p>
    </Section>
  );
}
