import Section from "@/components/ui/Section";
import SectionHead from "@/components/ui/SectionHead";
import Code from "@/components/ui/Code";
import RegionCompare from "@/components/prereq/RegionCompare";

const KEYBY = [
  ["같은 key는 같은 subtask로", "어느 Source가 읽었든 A는 항상 Count[0], B는 항상 Count[1]로 갑니다. 우체국이 주소를 보고 담당 집배원에게 넘기는 것과 같습니다."],
  ["state가 한 곳에 모여야 해서", "A의 개수를 세려면 모든 A가 한 subtask에 모여야 합니다. 나눠서 세면 어느 쪽도 정답을 갖지 못합니다."],
  ["그래서 모두가 모두에게 연결", "어떤 Source든 A도 B도 읽을 수 있으니, 모든 Source가 모든 Count로 보낼 수 있어야 합니다(all-to-all). TM을 건너면 네트워크 전송이 일어납니다."],
];

export default function RegionSection() {
  return (
    <Section id="region">
      <SectionHead eyebrow="사전 지식 5 · keyBy와 region" title="TM 하나가 죽었는데 왜 전체가 재시작되나">
        Flink는 데이터를 주고받는 선으로 이어진 Task 묶음을 region이라 부르고, 장애가 나면 그 region을 통째로 되돌립니다. 이어져 있으면 한쪽만 되돌릴 수 없기 때문입니다.
      </SectionHead>
      <div data-tour="region-keyby" className="mb-8 grid gap-x-8 gap-y-5 lg:grid-cols-3">
        {KEYBY.map(([t, d]) => (
          <div key={t} className="border-t-2 border-ink pt-3">
            <h3 className="mb-1.5 text-base font-semibold">{t}</h3>
            <p className="text-sm text-muted">{d}</p>
          </div>
        ))}
      </div>
      <div data-tour="region-compare">
        <RegionCompare />
      </div>
      <div data-tour="region-why" className="mt-6 grid gap-x-8 gap-y-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-1.5 text-base font-semibold">이어져 있으면 왜 같이 되돌리나</h3>
          <p className="text-sm text-muted">
            Count[0]이 죽으면 두 Source가 Count[0]에 보내던 데이터가 사라집니다. 다시 보내려면 Source가 checkpoint로 되감아야 하고, 되감은 Source는 Count[1]에도 이미 보낸 데이터를 또 보냅니다. 그러니 Count[1]도 같은 지점으로 돌아가야 합니다. 이렇게 연결을 따라 전부 번집니다.
          </p>
        </div>
        <div>
          <h3 className="mb-1.5 text-base font-semibold">설정과 예외</h3>
          <p className="text-sm text-muted">
            <Code>jobmanager.execution.failover-strategy</Code>가 <Code>region</Code>(기본)일 때의 동작이고, <Code>full</Code>이면 항상 전체를 재시작합니다. 배치 Job은 앞 단계 결과를 다 써 둔 뒤 다음 단계가 읽어서(blocking) region이 잘게 나뉘고, 실패한 단계만 다시 돌릴 수 있습니다.
          </p>
        </div>
      </div>
    </Section>
  );
}
