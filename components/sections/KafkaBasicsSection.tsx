import Section from "@/components/ui/Section";
import SectionHead from "@/components/ui/SectionHead";
import Code from "@/components/ui/Code";
import OffsetDemo from "@/components/prereq/OffsetDemo";
import TransactionDemo from "@/components/prereq/TransactionDemo";

export default function KafkaBasicsSection() {
  return (
    <Section id="kafka">
      <SectionHead eyebrow="사전 지식 2 · Kafka" title="다시 읽을 수 있고, 묶어서 커밋할 수 있다">
        시뮬레이터의 입력과 출력은 Kafka 토픽입니다. Kafka의 두 가지 성질이 나중에 유실과 중복을 막는 재료가 됩니다.
      </SectionHead>
      <div className="grid gap-6">
        <div data-tour="kafka-offset">
          <h3 className="mb-1 text-lg font-semibold">1. offset으로 되감기</h3>
          <p className="mb-3 max-w-[65ch] text-[14.5px] text-muted">
            파티션은 순서가 있는 로그이고, 레코드마다 <Code>offset</Code> 번호가 붙습니다. consumer는 어디까지 읽었는지를 offset으로만 기억하기 때문에, 저장해 둔 offset으로 돌아가면 같은 데이터를 다시 읽을 수 있습니다.
          </p>
          <OffsetDemo />
        </div>
        <div data-tour="kafka-txn">
          <h3 className="mb-1 text-lg font-semibold">2. 트랜잭션과 isolation.level</h3>
          <p className="mb-3 max-w-[65ch] text-[14.5px] text-muted">
            프로듀서는 여러 레코드를 하나의 트랜잭션으로 묶어 commit하거나 abort할 수 있습니다. consumer가 <Code>isolation.level=read_committed</Code>로 읽으면 commit된 레코드만 받습니다.
          </p>
          <TransactionDemo />
        </div>
      </div>
    </Section>
  );
}
