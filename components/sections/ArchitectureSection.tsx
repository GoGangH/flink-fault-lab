import Section from "@/components/ui/Section";
import SectionHead from "@/components/ui/SectionHead";
import { card, note } from "@/lib/ui";

export default function ArchitectureSection() {
  return (
    <Section id="arch">
      <SectionHead eyebrow="사전 지식 3 · 클러스터 구조" title="장애를 관리하는 쪽과 장애가 나는 쪽">
        JobManager는 Job 전체를 지휘하고 checkpoint를 조율합니다. 실제 연산은 TaskManager의 slot에서 돕니다. 복구는 결국 JobManager가 죽은 TaskManager의 몫을 다른 slot에 다시 배치하는 과정입니다.
      </SectionHead>
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div data-tour="arch-jm" className={card}>
          <h3 className="text-lg font-semibold">JobManager</h3>
          <div className="mt-3 divide-y divide-line border-t border-line">
            {[
              ["JobMaster", "Job 하나의 실행 그래프 관리, Task 상태 추적, 장애 처리"],
              ["ResourceManager", "slot 관리. TM이 죽으면 새 TM이나 남은 slot을 확보"],
              ["Dispatcher", "Job 제출을 받고 JobMaster를 띄움, Web UI 제공"],
              ["CheckpointCoordinator", "주기적으로 barrier를 주입하고 snapshot 완료를 집계"],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[minmax(150px,auto)_1fr] gap-3 py-2 text-sm">
                <b className="font-mono text-[13px] font-semibold">{k}</b>
                <span className="text-muted">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div data-tour="arch-tm" className={card}>
          <h3 className="text-lg font-semibold">TaskManager</h3>
          <p className={note + " mt-1"}>JVM 프로세스 하나. slot마다 Task(연산자 체인)를 실행하고, JobManager와 heartbeat를 주고받습니다.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[
              ["tm-1", ["Source[0] · orders-0 읽기", "KeyedCount[0] · key A", "Sink[0] · word-counts-0"]],
              ["tm-2", ["Source[1] · orders-1 읽기", "KeyedCount[1] · key B", "Sink[1] · word-counts-1"]],
            ].map(([name, slots]) => (
              <div key={name as string} className="rounded-md border border-dashed border-line p-3">
                <div className="mb-2 font-mono text-[13px]">{name}</div>
                {(slots as string[]).map((s) => (
                  <div key={s} className={"mt-1.5 rounded-md bg-sunk px-2.5 py-1.5 font-mono text-[13px] " + (s.includes("비어") ? "opacity-50" : "")}>
                    {s}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className={note}>
            시뮬레이터 배치입니다. 병렬도 2라서 연산자마다 subtask가 2개씩 생기고, slot sharing(기본값)으로 slot 하나에 Source·Count·Sink가 한 벌씩 들어갑니다. keyBy 때문에 데이터는 TM을 건너 다니기도 합니다.
          </p>
        </div>
      </div>
      <div data-tour="arch-causes" className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 max-sm:grid-cols-1">
        {[
          ["프로세스 다운", "OOM, 노드 장애, Pod eviction"],
          ["네트워크 단절", "heartbeat 응답이 끊김"],
          ["사용자 코드 예외", "역직렬화 실패, NPE 등"],
          ["외부 시스템 오류", "Kafka broker, 저장소 장애"],
        ].map(([t, d]) => (
          <div key={t} className="rounded-md border border-line bg-surface p-3.5 text-sm">
            <b className="mb-1 block text-[15px]">{t}</b>
            <span className="text-muted">{d}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
